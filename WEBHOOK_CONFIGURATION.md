# Stripe Webhook Configuration Guide

## Overview

The Click Clack Cash Flow cashout server now includes full Stripe webhook support with signature verification. This enables real-time processing of Stripe events related to payments, transfers, and payouts.

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
STRIPE_WEBHOOK_SECRET="whsec_PNDhlSIih9OeGmB0gC6KBEHlyQImKrLQ"
```

This webhook secret is already configured and ready to use.

### Stripe Dashboard Setup

1. **Go to your Stripe Dashboard** → Developers → Webhooks
2. **Click "Add endpoint"**
3. **Set the endpoint URL**: `https://your-domain.com:4000/webhook`
   - For local development: `http://localhost:4000/webhook`
   - For production: Replace with your actual domain
4. **Configure events to send**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `transfer.created`
   - `transfer.updated`
   - `payout.created`
   - `payout.updated`
   - `account.updated`
5. **Set the webhook secret**: `whsec_PNDhlSIih9OeGmB0gC6KBEHlyQImKrLQ`

## Webhook Endpoints

### POST /webhook
- **Purpose**: Receives Stripe webhook events
- **Security**: Signature verification with configured webhook secret
- **Supported Events**:
  - `payment_intent.succeeded` - Updates transaction status to success
  - `payment_intent.payment_failed` - Updates transaction status to failed
  - `transfer.created` - Logs transfer creation
  - `transfer.updated` - Logs transfer status updates
  - `payout.created` - Logs payout creation
  - `payout.updated` - Logs payout status updates
  - `account.updated` - Logs connected account changes

### GET /webhook/status
- **Purpose**: Monitor webhook activity and configuration
- **Returns**:
  ```json
  {
    "webhook_configured": true,
    "total_events": 42,
    "recent_events": [...],
    "status": "active"
  }
  ```

## Event Processing

### Payment Intent Events
- **payment_intent.succeeded**: Updates transaction logs with success status
- **payment_intent.payment_failed**: Updates transaction logs with failure status and error message

### Transfer Events
- **transfer.created**: Logs when Stripe creates a transfer
- **transfer.updated**: Logs transfer status changes (pending → paid → failed)

### Payout Events
- **payout.created**: Logs when a payout is created to connected accounts
- **payout.updated**: Logs payout status changes

### Account Events
- **account.updated**: Logs changes to connected account capabilities

## Logging and Audit

### Webhook Event Logging
All webhook events are logged to `logs/webhook-events.json` with:
- Event ID and type
- Timestamp and processing time
- Event data and status
- Maintains last 1000 events for audit purposes

### Transaction Integration
Webhook events automatically update transaction logs in `logs/transactions.json`:
- Links webhook events to existing transactions by Stripe ID
- Updates transaction status based on webhook events
- Adds error messages for failed payments

## Testing

### Health Check
```bash
curl http://localhost:4000/health
```
Should return `"webhookConfigured": true`

### Webhook Status
```bash
curl http://localhost:4000/webhook/status
```
Shows webhook configuration and recent events

### Manual Event Test (Development Only)
For testing purposes, you can use Stripe CLI to forward events:
```bash
stripe listen --forward-to localhost:4000/webhook
```

## Security Features

1. **Signature Verification**: All webhook requests are verified using the configured webhook secret
2. **Rate Limiting**: Webhook endpoint respects the same rate limits as other endpoints
3. **Error Handling**: Robust error handling prevents webhook failures from affecting server stability
4. **Audit Logging**: Complete audit trail of all webhook events and processing

## Troubleshooting

### Common Issues

1. **"No stripe-signature header" Error**
   - Ensure webhook secret is configured in Stripe dashboard
   - Verify endpoint URL is correct

2. **"Signature verification failed" Error**
   - Check webhook secret matches in both .env and Stripe dashboard
   - Ensure webhook secret starts with `whsec_`

3. **Events not processing**
   - Check `/webhook/status` endpoint for recent events
   - Verify event types are enabled in Stripe dashboard
   - Check server logs for processing errors

### Log Files
- `logs/webhook-events.json` - All webhook events received
- `logs/transactions.json` - Transaction updates from webhooks
- `logs/cashout-server.log` - General server logs including webhook processing
- `logs/error.log` - Error logs for failed webhook processing

## Production Considerations

1. **HTTPS Required**: Stripe requires HTTPS for production webhook endpoints
2. **Firewall**: Ensure port 4000 is accessible from Stripe's IP ranges
3. **Load Balancing**: If using multiple servers, ensure webhook endpoint is properly routed
4. **Monitoring**: Monitor `/webhook/status` endpoint for webhook health
5. **Backup**: Consider backing up webhook event logs for compliance

## Integration with Existing Features

The webhook system integrates seamlessly with:
- **Cashout Processing**: Updates transaction status from webhook events
- **USD Verification**: Webhook events trigger USD amount verification
- **Audit Logging**: All webhook activity is logged for compliance
- **Health Monitoring**: Webhook status included in health checks

## Event Flow Example

1. User initiates cashout via `/cashout` endpoint
2. Stripe processes payment and creates `payment_intent`
3. Stripe sends `payment_intent.succeeded` webhook to `/webhook`
4. Webhook handler verifies signature and processes event
5. Transaction log is updated with success status
6. Event is logged to `webhook-events.json` for audit
7. User can check status via existing endpoints

This creates a complete real-time feedback loop for all Stripe transactions.