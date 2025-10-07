# Stripe Integration Setup Guide

## ⚠️ CRITICAL: Your database is currently over quota
Before proceeding, contact Supabase support at https://supabase.help to restore database access.

## Complete Production Setup for Real USD Transactions

### 1. Stripe Account Setup

1. **Create/Login to Stripe Account**
   - Go to https://stripe.com
   - Create account or login
   - Switch to Test Mode for testing

2. **Get API Keys**
   - Dashboard → Developers → API Keys
   - Copy the **Secret Key** (starts with `sk_test_...`)

3. **Setup Webhook Endpoint**
   - Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - URL: `https://tqbybefpnwxukzqkanip.supabase.co/functions/v1/stripe-webhook`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `transfer.created`
     - `transfer.updated`
     - `payout.created`
     - `payout.paid`
   - Copy the **Webhook Secret** (starts with `whsec_...`)

### 2. Add Secrets to Supabase

1. Go to https://supabase.com/dashboard/project/tqbybefpnwxukzqkanip/settings/functions
2. Add these secrets:
   ```
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### 3. Database Migration (Already Done)

✅ The following tables have been created:
- `user_earnings` - Real ad revenue tracking
- `real_cashout_requests` - Cashout transaction log
- `stripe_webhooks` - Webhook event log
- `stripe_payouts` - Stripe payout tracking

✅ Functions created:
- `get_user_cashout_balance(user_id)` - Get available balance

### 4. Edge Functions (Already Deployed)

✅ The following edge functions are configured:
- `cashout` - Process real USD cashouts via Stripe
- `stripe-webhook` - Handle Stripe webhook events

### 5. Test the Integration

Once database is restored and secrets are added:

1. **Add Test Balance**
   ```sql
   -- In Supabase SQL Editor
   INSERT INTO application_balance (id, balance_amount, pending_transfers)
   VALUES (1, 100.00, 0)
   ON CONFLICT (id) DO UPDATE SET balance_amount = 100.00;
   ```

2. **Add Test Earnings**
   ```sql
   INSERT INTO user_earnings (user_id, earning_type, amount_usd, ad_network)
   VALUES ('user_123', 'ad_click', 5.00, 'propellerads');
   ```

3. **Test Cashout**
   - Go to your app
   - Earn at least 100 coins ($1)
   - Click "Cash Out Real Money"
   - Enter email and select payment method
   - Submit cashout

4. **Verify in Stripe Dashboard**
   - Go to Stripe Dashboard → Payments
   - You should see the payment intent
   - Check webhook logs in Dashboard → Developers → Webhooks

### 6. Production Checklist

Before going live:

- [ ] Switch Stripe to Live Mode
- [ ] Update `STRIPE_SECRET_KEY` to live key (`sk_live_...`)
- [ ] Update webhook endpoint to use live webhook secret
- [ ] Enable RLS on all tables (already done)
- [ ] Test all payout methods
- [ ] Set up monitoring alerts
- [ ] Configure fraud prevention rules in Stripe
- [ ] Add terms of service for cashouts
- [ ] Implement identity verification for large amounts

### 7. Real Ad Network Integration

To earn real revenue, integrate with:

**PropellerAds**
```typescript
await RealAdNetworkService.getInstance().setupPropellerAds(
  'YOUR_PUBLISHER_ID',
  'YOUR_ZONE_ID'
);
```

**Google AdSense**
```typescript
await RealAdNetworkService.getInstance().setupAdSense(
  'YOUR_PUBLISHER_ID'
);
```

**OfferToro**
```typescript
await RealAdNetworkService.getInstance().setupOfferToro(
  'YOUR_API_KEY',
  'YOUR_PUBLISHER_ID'
);
```

### 8. Monitoring & Compliance

**View Webhook Events:**
```sql
SELECT * FROM stripe_webhooks 
ORDER BY created_at DESC 
LIMIT 50;
```

**View Cashout Requests:**
```sql
SELECT * FROM real_cashout_requests 
ORDER BY created_at DESC;
```

**Check Application Balance:**
```sql
SELECT * FROM application_balance;
```

**View User Earnings:**
```sql
SELECT 
  user_id,
  SUM(amount_usd) as total_earned,
  COUNT(*) as earning_count
FROM user_earnings
GROUP BY user_id;
```

### 9. Security Considerations

- All Stripe webhooks are verified with signature validation
- RLS policies protect user data
- Service role credentials stored securely in Supabase
- All transactions logged for audit trail
- Balance validation prevents overdrafts

### Support Resources

- Stripe Documentation: https://stripe.com/docs
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Webhook Testing: https://stripe.com/docs/webhooks/test

---

## Current System Status

✅ Database schema created
✅ Edge functions deployed  
✅ Webhook handler configured
✅ RLS policies enabled
✅ Cashout service ready
✅ Ad network integration ready

⚠️ **BLOCKED:** Database quota exceeded - contact Supabase support
⚠️ **NEEDED:** Add Stripe API keys to Supabase secrets
⚠️ **NEEDED:** Configure Stripe webhook endpoint
