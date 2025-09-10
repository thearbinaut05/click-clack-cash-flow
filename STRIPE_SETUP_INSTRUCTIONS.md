# Real USD Cashout Setup Instructions

## 🚨 IMPORTANT: This guide sets up REAL money transactions

This document explains how to configure the Click Clack Cash Flow app for real USD cashouts using live Stripe keys.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Stripe Connect enabled on your account
3. A connected account for receiving payouts

## Step 1: Get Your Live Stripe API Keys

1. Visit https://dashboard.stripe.com/apikeys
2. Click "Reveal live key" for both keys
3. Copy your live keys:
   - **Secret key** (starts with `sk_live_`)
   - **Publishable key** (starts with `pk_live_`)

⚠️ **NEVER use test keys (`sk_test_`, `pk_test_`) for real money transactions**

## Step 2: Set Up Stripe Connect

1. Visit https://dashboard.stripe.com/connect/accounts/overview
2. Click "Create account" or "Add account"
3. Follow the onboarding process to create a connected account
4. Once created, copy the Account ID (starts with `acct_`)

## Step 3: Configure Environment Variables

Update your `.env` file with the real values:

```bash
# LIVE Stripe API Keys
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_publishable_key

# Connected Account ID
CONNECTED_ACCOUNT_ID=acct_your_actual_connected_account_id

# Other configuration (keep as is)
PORT=4000
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-production-domain.com
```

## Step 4: Verify Configuration

1. Start the cashout server:
   ```bash
   node cashout-server.js
   ```

2. Check the health endpoint:
   ```bash
   curl http://localhost:4000/health
   ```

3. Look for these indicators in the response:
   ```json
   {
     "status": "ok",
     "stripeLiveMode": true,
     "connectedAccountConfigured": true,
     "readyForRealCashouts": true
   }
   ```

## Step 5: Test Real Cashouts

⚠️ **WARNING: This will process real money transactions**

1. Start your frontend application
2. Earn some coins in the game
3. Click "Cash Out Real Money"
4. Enter a valid email address
5. Process the cashout

## Troubleshooting

### Server won't start
- Check that your Stripe secret key starts with `sk_live_`
- Verify the key is complete and not truncated
- Make sure the connected account ID starts with `acct_`

### Cashouts fail
- Verify your connected account has proper payout methods configured
- Check that your Stripe account has sufficient permissions
- Review the server logs in the `logs/` directory

### Health check shows issues
- `stripeLiveMode: false` - You're using test keys instead of live keys
- `connectedAccountConfigured: false` - Your connected account ID is missing or invalid
- `readyForRealCashouts: false` - One or more requirements are not met

## Security Notes

1. **Never commit real API keys to version control**
2. **Use environment variables in production**
3. **Restrict API key permissions in Stripe dashboard**
4. **Monitor transactions regularly**
5. **Set up webhooks for transaction notifications**

## Support

For Stripe-specific issues, visit https://stripe.com/docs/connect

For application issues, check the logs directory or contact support.