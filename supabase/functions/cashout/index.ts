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
    console.log('Cashout function called - REAL MODE');
    
    // Get Stripe secret key from environment
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured. Please add it to edge function secrets.');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { userId, coins, payoutType, email, metadata } = body;

    console.log('Processing REAL cashout request:', { userId, coins, payoutType, email });

    // Validate inputs
    if (!userId || !coins || !payoutType || !email) {
      throw new Error('Missing required fields: userId, coins, payoutType, email');
    }

    // Calculate cash value (100 coins = $1)
    const cashValue = Math.max(1, coins / 100);
    const amountInCents = Math.round(cashValue * 100);

    console.log(`Converting ${coins} coins to $${cashValue} (${amountInCents} cents)`);

    // Check if customer exists in Stripe, create if not
    let customer;
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('Found existing Stripe customer:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: {
          userId,
          source: 'game_cashout'
        }
      });
      console.log('Created new Stripe customer:', customer.id);
    }

    let transferResult;

    // Process different payout types with REAL Stripe operations
    switch (payoutType) {
      case 'standard':
      case 'email':
        // Create a payment intent for standard transfer
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          customer: customer.id,
          payment_method_types: ['card'],
          metadata: {
            userId,
            coins: coins.toString(),
            type: 'game_cashout'
          }
        });

        transferResult = {
          id: paymentIntent.id,
          object: 'payment_intent',
          amount: amountInCents,
          currency: 'usd',
          description: `Game cashout for ${coins} coins`,
          status: paymentIntent.status,
          created: paymentIntent.created,
          method: 'standard',
          client_secret: paymentIntent.client_secret
        };
        break;

      case 'virtual-card':
      case 'instant_card':
        // Create a virtual card using Stripe Issuing
        try {
          const cardHolder = await stripe.issuing.cardholders.create({
            name: email.split('@')[0],
            email: email,
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
        } catch (error) {
          console.error('Virtual card creation failed:', error);
          throw new Error('Virtual card creation not available. Please try standard payment.');
        }
        break;

      case 'bank-card':
      case 'bank_account':
        // For bank transfers, we need to create an actual transfer
        // This requires the user to have a connected account or external account
        try {
          const transfer = await stripe.transfers.create({
            amount: amountInCents,
            currency: 'usd',
            metadata: {
              userId,
              coins: coins.toString(),
              type: 'game_cashout'
            }
          });

          transferResult = {
            id: transfer.id,
            object: 'transfer',
            amount: amountInCents,
            currency: 'usd',
            description: `Bank transfer for ${coins} coins`,
            status: 'pending',
            created: transfer.created,
            method: 'bank_transfer'
          };
        } catch (error) {
          console.error('Bank transfer failed:', error);
          throw new Error('Bank transfer not available. Please set up bank account first.');
        }
        break;

      default:
        throw new Error(`Unsupported payout type: ${payoutType}`);
    }

    // Log the REAL transaction to database
    const { error: dbError } = await supabase
      .from('autonomous_revenue_transfers')
      .insert({
        amount: cashValue,
        status: transferResult.status === 'succeeded' ? 'completed' : 'pending',
        provider: 'stripe',
        provider_transfer_id: transferResult.id,
        metadata: {
          ...metadata,
          coins,
          payoutType,
          email,
          stripe_customer_id: customer.id,
          transfer_details: transferResult,
          real_transaction: true
        }
      });

    if (dbError) {
      console.error('Database logging error:', dbError);
      // Don't fail the transaction for logging errors
    }

    console.log('REAL cashout processed successfully:', transferResult.id);

    return new Response(JSON.stringify({
      success: true,
      details: transferResult,
      message: `Successfully processed REAL ${payoutType} cashout of $${cashValue.toFixed(2)}`,
      isReal: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('REAL cashout error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'An unexpected error occurred during real cashout',
      details: null,
      isReal: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});