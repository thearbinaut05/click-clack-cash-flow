import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey || !webhookSecret) {
      throw new Error('Stripe keys not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log('Webhook received:', event.type, event.id);

    // Log webhook event
    await supabase.from('stripe_webhooks').insert({
      event_id: event.id,
      event_type: event.type,
      payload: event as any,
      processed: false
    });

    // Handle different webhook types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Update cashout request status
        await supabase
          .from('real_cashout_requests')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntent.id
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        // Mark webhook as processed
        await supabase
          .from('stripe_webhooks')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('event_id', event.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);
        
        // Update cashout request status
        await supabase
          .from('real_cashout_requests')
          .update({ 
            status: 'failed',
            error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
            completed_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        // Refund to application balance
        const { data: cashoutData } = await supabase
          .from('real_cashout_requests')
          .select('amount_usd')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();

        if (cashoutData) {
          await supabase.rpc('add_funds_to_balance', { amount: cashoutData.amount_usd });
        }

        await supabase
          .from('stripe_webhooks')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('event_id', event.id);
        break;
      }

      case 'transfer.created':
      case 'transfer.updated': {
        const transfer = event.data.object as Stripe.Transfer;
        console.log('Transfer event:', transfer.id, transfer.amount);
        
        await supabase
          .from('real_cashout_requests')
          .update({ 
            stripe_transfer_id: transfer.id,
            status: transfer.reversed ? 'refunded' : 'completed'
          })
          .eq('stripe_transfer_id', transfer.id);

        await supabase
          .from('stripe_webhooks')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('event_id', event.id);
        break;
      }

      case 'payout.created':
      case 'payout.updated':
      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        console.log('Payout event:', payout.id, payout.status);
        
        await supabase
          .from('stripe_payouts')
          .upsert({
            stripe_payout_id: payout.id,
            amount: payout.amount / 100,
            currency: payout.currency,
            status: payout.status,
            arrival_date: new Date(payout.arrival_date * 1000).toISOString(),
            method: payout.method,
            destination: payout.destination as string,
            metadata: payout.metadata as any
          }, { onConflict: 'stripe_payout_id' });

        await supabase
          .from('stripe_webhooks')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('event_id', event.id);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
        await supabase
          .from('stripe_webhooks')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('event_id', event.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Webhook processing failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
