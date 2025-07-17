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
      case "create_payment_intent":
        result = await stripe.paymentIntents.create({
          amount: payload.amount,
          currency: payload.currency || "usd",
          metadata: payload.metadata || {},
        });
        break;

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