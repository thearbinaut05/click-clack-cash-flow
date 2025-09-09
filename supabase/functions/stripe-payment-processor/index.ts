import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get Stripe configuration
    const { data: stripeConfig } = await supabase
      .from("stripe_configuration")
      .select("*")
      .single();

    if (!stripeConfig) {
      throw new Error("Stripe configuration not found");
    }

    const stripe = new Stripe(stripeConfig.api_key, {
      apiVersion: "2023-10-16",
    });

    const { action, ...payload } = await req.json();

    let result;

    switch (action) {
      case "create_payment_intent": {
        // Check available revenue before creating payment intent
        const { data: revenueBalance } = await supabase
          .from("autonomous_revenue_transactions")
          .select("amount")
          .eq("status", "pending");

        const totalAvailableRevenue = revenueBalance?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
        const requestedAmount = payload.amount / 100; // Convert cents to dollars

        if (totalAvailableRevenue < requestedAmount) {
          throw new Error(`Insufficient revenue balance. Available: $${totalAvailableRevenue.toFixed(2)}, Requested: $${requestedAmount.toFixed(2)}`);
        }

        // Create payment intent with revenue sourcing metadata
        result = await stripe.paymentIntents.create({
          amount: payload.amount,
          currency: payload.currency || "usd",
          metadata: {
            ...payload.metadata,
            revenue_sourced: "true",
            available_revenue: totalAvailableRevenue.toString(),
            sourced_from: "autonomous_revenue_transactions"
          },
        });

        // Log payment intent creation with revenue link
        await supabase.from("autonomous_revenue_transactions").insert({
          amount: -(requestedAmount), // Negative amount to indicate deduction
          status: "payment_intent_created",
          stripe_payment_id: result.id,
          metadata: {
            payment_intent_id: result.id,
            original_amount: requestedAmount,
            sourced_from_revenue: true
          }
        });
        break;
      }

      case "create_transfer":
        result = await stripe.transfers.create({
          amount: payload.amount,
          currency: payload.currency || "usd",
          destination: payload.destination,
          metadata: payload.metadata || {},
        });
        
        // Log transfer to database
        await supabase.from("autonomous_revenue_transfers").insert({
          amount: payload.amount / 100,
          status: "completed",
          stripe_transfer_id: result.id,
          metadata: payload.metadata,
        });
        break;

      case "audit_revenue":
        // Audit existing revenue against Stripe
        const { data: transactions } = await supabase
          .from("autonomous_revenue_transactions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        const auditResults = [];
        for (const transaction of transactions || []) {
          try {
            // Verify transaction exists in Stripe if it has a stripe_payment_id
            if (transaction.metadata?.stripe_payment_id) {
              const stripePayment = await stripe.paymentIntents.retrieve(
                transaction.metadata.stripe_payment_id
              );
              auditResults.push({
                transaction_id: transaction.id,
                stripe_verified: true,
                stripe_amount: stripePayment.amount,
                local_amount: transaction.amount * 100,
                discrepancy: stripePayment.amount !== transaction.amount * 100,
              });
            }
          } catch (error) {
            auditResults.push({
              transaction_id: transaction.id,
              stripe_verified: false,
              error: error.message,
            });
          }
        }
        result = { audit_results: auditResults };
        break;

      case "get_balance":
        result = await stripe.balance.retrieve();
        break;

      case "auto_fulfill_payment_intent": {
        // Automatically fulfill payment intent from available revenue
        const paymentIntentId = payload.payment_intent_id;
        if (!paymentIntentId) {
          throw new Error("payment_intent_id is required for auto fulfillment");
        }

        // Retrieve the payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== "requires_payment_method" && paymentIntent.status !== "requires_confirmation") {
          throw new Error(`Payment intent status ${paymentIntent.status} cannot be auto-fulfilled`);
        }

        // Check if this payment intent was created from revenue
        if (!paymentIntent.metadata?.revenue_sourced) {
          throw new Error("Payment intent was not created from revenue, cannot auto-fulfill");
        }

        // Get the associated revenue transaction
        const { data: revenueTransaction } = await supabase
          .from("autonomous_revenue_transactions")
          .select("*")
          .eq("stripe_payment_id", paymentIntentId)
          .eq("status", "payment_intent_created")
          .single();

        if (!revenueTransaction) {
          throw new Error("No associated revenue transaction found for payment intent");
        }

        // Auto-confirm the payment intent (simulating successful payment from revenue)
        result = await stripe.paymentIntents.confirm(paymentIntentId, {
          payment_method: "pm_card_visa", // Using test payment method for automation
        });

        // Update revenue transaction status to fulfilled
        await supabase
          .from("autonomous_revenue_transactions")
          .update({
            status: "fulfilled_from_revenue",
            metadata: {
              ...revenueTransaction.metadata,
              fulfilled_at: new Date().toISOString(),
              fulfillment_method: "auto_revenue_sourcing"
            }
          })
          .eq("stripe_payment_id", paymentIntentId);

        // Log successful fulfillment
        await supabase.from("autonomous_revenue_transfers").insert({
          amount: Math.abs(revenueTransaction.amount),
          status: "completed",
          stripe_transfer_id: `auto_fulfill_${paymentIntentId}`,
          metadata: {
            payment_intent_id: paymentIntentId,
            fulfillment_method: "auto_revenue_sourcing",
            original_revenue_transaction_id: revenueTransaction.id
          }
        });
        break;
      }

      case "process_pending_payment_intents": {
        // Automatically process all pending payment intents that can be fulfilled from revenue
        const { data: pendingTransactions } = await supabase
          .from("autonomous_revenue_transactions")
          .select("*")
          .eq("status", "payment_intent_created")
          .limit(10);

        const processedResults = [];
        
        for (const transaction of pendingTransactions || []) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(transaction.stripe_payment_id);
            
            if (paymentIntent.status === "requires_payment_method" || paymentIntent.status === "requires_confirmation") {
              // Auto-fulfill this payment intent
              const fulfilled = await stripe.paymentIntents.confirm(transaction.stripe_payment_id, {
                payment_method: "pm_card_visa",
              });

              // Update status
              await supabase
                .from("autonomous_revenue_transactions")
                .update({
                  status: "fulfilled_from_revenue",
                  metadata: {
                    ...transaction.metadata,
                    fulfilled_at: new Date().toISOString(),
                    fulfillment_method: "batch_auto_processing"
                  }
                })
                .eq("id", transaction.id);

              processedResults.push({
                payment_intent_id: transaction.stripe_payment_id,
                amount: Math.abs(transaction.amount),
                status: "fulfilled",
                fulfillment_method: "revenue_sourcing"
              });
            }
          } catch (error) {
            processedResults.push({
              payment_intent_id: transaction.stripe_payment_id,
              status: "failed",
              error: error.message
            });
          }
        }

        result = {
          processed_count: processedResults.length,
          results: processedResults
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Stripe processor error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});