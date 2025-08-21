import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const body = await req.json();
    const { userId, coins, payoutType, email, metadata } = body;

    console.log('Processing cashout request:', { userId, coins, payoutType, email });

    // Validate inputs
    if (!userId || !coins || !payoutType || !email) {
      throw new Error('Missing required fields: userId, coins, payoutType, email');
    }

    // Calculate cash value (100 coins = $1)
    const cashValue = Math.max(1, coins / 100);
    const amountInCents = Math.round(cashValue * 100);

    // Check if customer exists, if not create one
    let customer;
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: {
          userId,
          source: 'game_cashout'
        }
      });
    }

    // For test mode, we'll simulate different payout methods
    let transferResult;
    
    switch (payoutType) {
      case 'standard':
        // Simulate standard bank transfer
        transferResult = {
          id: `tr_test_${Date.now()}`,
          object: 'transfer',
          amount: amountInCents,
          currency: 'usd',
          description: `Game cashout for ${coins} coins`,
          status: 'paid',
          created: Math.floor(Date.now() / 1000),
          method: 'standard'
        };
        break;

      case 'virtual-card':
        // Simulate virtual card creation
        const cardHolder = await stripe.issuing.cardholders.create({
          name: customer.name || email.split('@')[0],
          email: customer.email,
          type: 'individual',
          billing: {
            address: {
              line1: '123 Main St',
              city: 'Anytown',
              state: 'CA',
              postal_code: '12345',
              country: 'US'
            }
          }
        });

        const virtualCard = await stripe.issuing.cards.create({
          cardholder: cardHolder.id,
          currency: 'usd',
          type: 'virtual',
          spending_controls: {
            spending_limits: [
              {
                amount: amountInCents,
                interval: 'all_time'
              }
            ]
          }
        });

        transferResult = {
          id: virtualCard.id,
          object: 'virtual_card',
          amount: amountInCents,
          currency: 'usd',
          description: `Virtual card for ${coins} coins`,
          status: 'active',
          card_number: virtualCard.number,
          exp_month: virtualCard.exp_month,
          exp_year: virtualCard.exp_year,
          cvc: virtualCard.cvc,
          method: 'virtual_card'
        };
        break;

      case 'bank-card':
        // For bank card, we would typically need the user's bank details
        // For now, simulate a bank transfer
        transferResult = {
          id: `ba_test_${Date.now()}`,
          object: 'bank_transfer',
          amount: amountInCents,
          currency: 'usd',
          description: `Bank card transfer for ${coins} coins`,
          status: 'pending',
          created: Math.floor(Date.now() / 1000),
          method: 'bank_card'
        };
        break;

      default:
        throw new Error(`Unsupported payout type: ${payoutType}`);
    }

    // Log the transaction to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: dbError } = await supabase
      .from('autonomous_revenue_transfers')
      .insert({
        amount: cashValue,
        status: transferResult.status === 'paid' ? 'completed' : 'pending',
        provider: 'stripe',
        provider_transfer_id: transferResult.id,
        metadata: {
          ...metadata,
          coins,
          payoutType,
          email,
          stripe_customer_id: customer.id,
          transfer_details: transferResult
        }
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    console.log('Cashout processed successfully:', transferResult.id);

    return new Response(JSON.stringify({
      success: true,
      details: transferResult,
      message: `Successfully processed ${payoutType} cashout of $${cashValue.toFixed(2)}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Cashout error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'An unexpected error occurred during cashout',
      details: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});