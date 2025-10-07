import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 REAL CASHOUT FUNCTION CALLED');
    
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { userId, coins, payoutType, email, metadata } = body;

    console.log('Processing cashout:', { userId, coins, payoutType, email });

    if (!userId || !coins || !payoutType || !email) {
      throw new Error('Missing required fields');
    }

    const cashValue = Math.max(1, coins / 100);
    const amountInCents = Math.round(cashValue * 100);

    console.log(`Converting ${coins} coins to $${cashValue}`);

    // Check application balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('application_balance')
      .select('balance_amount')
      .eq('id', 1)
      .single();

    if (balanceError || !balanceData || balanceData.balance_amount < cashValue) {
      throw new Error(`Insufficient balance. Available: $${balanceData?.balance_amount || 0}`);
    }

    // Deduct from application balance
    const { error: deductError } = await supabase
      .from('application_balance')
      .update({ 
        balance_amount: balanceData.balance_amount - cashValue,
        last_updated_at: new Date().toISOString()
      })
      .eq('id', 1);

    if (deductError) {
      throw new Error(`Failed to deduct balance: ${deductError.message}`);
    }

    console.log(`✅ Deducted $${cashValue}. New balance: $${balanceData.balance_amount - cashValue}`);

    // Get or create Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: { userId, source: 'game_cashout' }
      });
    }

    console.log('Stripe customer:', customer.id);

    let transferResult;

    // Process payout
    switch (payoutType) {
      case 'standard':
      case 'email': {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          customer: customer.id,
          payment_method_types: ['card'],
          metadata: {
            userId,
            coins: coins.toString(),
            type: 'game_cashout',
            email
          }
        });

        transferResult = {
          id: paymentIntent.id,
          object: 'payment_intent',
          amount: amountInCents,
          currency: 'usd',
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret
        };
        break;
      }

      case 'virtual_card':
      case 'instant_card': {
        throw new Error('Virtual cards require Stripe Issuing. Please use standard payout.');
      }

      case 'bank_account':
      case 'bank_card': {
        const transfer = await stripe.transfers.create({
          amount: amountInCents,
          currency: 'usd',
          metadata: { userId, coins: coins.toString(), type: 'game_cashout' }
        });

        transferResult = {
          id: transfer.id,
          object: 'transfer',
          amount: amountInCents,
          currency: 'usd',
          status: 'pending'
        };
        break;
      }

      default:
        throw new Error(`Unsupported payout type: ${payoutType}`);
    }

    // Log to database
    const { error: dbError } = await supabase
      .from('real_cashout_requests')
      .insert({
        user_id: userId,
        amount_usd: cashValue,
        coins,
        payout_type: payoutType,
        email,
        status: transferResult.status === 'succeeded' ? 'completed' : 'processing',
        stripe_payment_intent_id: transferResult.id,
        stripe_customer_id: customer.id,
        metadata: {
          ...metadata,
          transfer_details: transferResult,
          pre_balance: balanceData.balance_amount,
          post_balance: balanceData.balance_amount - cashValue
        }
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Rollback balance
      await supabase
        .from('application_balance')
        .update({ balance_amount: balanceData.balance_amount })
        .eq('id', 1);
      throw new Error('Failed to log cashout');
    }

    console.log('✅ REAL CASHOUT COMPLETED:', transferResult.id);

    return new Response(JSON.stringify({
      success: true,
      details: transferResult,
      message: `Successfully processed ${payoutType} cashout of $${cashValue.toFixed(2)}`,
      isReal: true,
      transaction_id: transferResult.id,
      autonomous_revenue_balance: balanceData.balance_amount - cashValue
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ CASHOUT ERROR:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Cashout failed',
      isReal: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
