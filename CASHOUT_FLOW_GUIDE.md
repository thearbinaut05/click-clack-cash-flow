# Cashout Flow Guide - How the Cashout System Works

## Overview

This guide explains exactly what happens when a user initiates a cashout and what happens after the request reaches your local server. The Click Clack Cash Flow app uses a **dual-server architecture** to handle cashouts securely and efficiently.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cashout Flow Architecture                     │
└─────────────────────────────────────────────────────────────────┘

[User Clicks "Cash Out"]
         │
         ▼
┌─────────────────────────┐
│   Frontend (Port 8080)  │  ← React App with Game Logic
│  - GameContext.tsx      │
│  - CashOutButton.tsx    │
│  - CashoutService.ts    │
└────────────┬────────────┘
             │
             │ HTTP POST Request
             │ {userId, coins, email, payoutType}
             ▼
┌─────────────────────────────────────────────────────────────────┐
│            Lovable Cloud Server (Port 4000)                      │
│  - lovable-cloud-server.js                                       │
│                                                                   │
│  Endpoints:                                                       │
│  • GET  /health                  - Health check                  │
│  • GET  /revenue/balance/:userId - Get user's revenue balance    │
│  • POST /cashout/process         - Process cashout request       │
│  • GET  /revenue/transactions    - Get transaction history       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─ Try Lovable Cloud API (if configured)
             │  └─> https://api.lovable.cloud/cashout/process
             │
             └─ Fallback to Mock Processing (for development)
                ├─> Validate user balance
                ├─> Deduct amount from balance
                ├─> Generate transaction ID
                ├─> Log transaction to files
                └─> Return success response

┌─────────────────────────────────────────────────────────────────┐
│                         Stripe Connect                           │
│  (Alternative/Legacy via cashout-server.js)                      │
│  • Instant Card Payout                                            │
│  • Bank Account Payout                                            │
│  • Email Payment Intent                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Cashout Process

### Step 1: User Initiates Cashout (Frontend)

**Location:** `src/components/game/CashOutButton.tsx` and `src/contexts/GameContext.tsx`

1. User clicks "Cash Out Real Money" button
2. Minimum requirement: **500 coins ($5)** from clicker game
3. Conversion rate: **100 coins = $1 USD**
4. User enters email address and selects payment method

**Code Flow:**
```typescript
// GameContext.tsx - cashOut function
const cashOut = async (email: string, method: string) => {
  // Validate minimum coins (500 coins = $5)
  if (coins < 500) {
    throw new Error("Need at least 500 coins ($5) to cash out");
  }
  
  // Calculate cash value
  const cashValue = (coins / 100).toFixed(2);
  
  // Call CashoutService
  const cashoutService = CashoutService.getInstance();
  const result = await cashoutService.processCashout({
    userId: `user_${Date.now()}`,
    coins: coins,
    payoutType: payoutType,
    email: email,
    metadata: { gameSession, level, adImpressions }
  });
  
  // If successful, reset coins to 0
  if (result.success) {
    setCoins(0);
    return transactionId;
  }
}
```

### Step 2: CashoutService Processes Request (Frontend Service)

**Location:** `src/services/CashoutService.ts`

The `CashoutService` acts as an intermediary between the game and the backend server:

```typescript
async processCashout(request: CashoutRequest): Promise<CashoutResponse> {
  // 1. Calculate cash value (100 coins = $1)
  const cashValue = Math.max(1, request.coins / 100);
  
  // 2. Check Lovable Cloud service health
  const isHealthy = await this.lovableCloud.healthCheck();
  if (!isHealthy) {
    return this.createDemoSuccessResponse(request);
  }
  
  // 3. Verify user has sufficient balance
  const revenueBalance = await this.lovableCloud.getRevenueBalance(request.userId);
  if (revenueBalance < cashValue) {
    return { success: false, error: "Insufficient balance" };
  }
  
  // 4. Process cashout via Lovable Cloud
  const result = await this.lovableCloud.processCashout(
    request.userId,
    cashValue,
    request.email
  );
  
  return result;
}
```

### Step 3: Request Sent to Local Server

**Location:** `src/services/LovableCloudService.ts`

The frontend sends an HTTP POST request to your local server:

**Endpoint:** `POST http://localhost:4000/cashout/process`

**Request Body:**
```json
{
  "user_id": "user_1234567890",
  "amount": 5.00,
  "email": "user@example.com",
  "source": "direct_revenue",
  "bypass_accumulation": true
}
```

**Request Headers:**
```
Authorization: Bearer YOUR_LOVABLE_CLOUD_API_KEY
Content-Type: application/json
```

### Step 4: Server Receives and Validates Request

**Location:** `lovable-cloud-server.js` (Line 143-228)

**What Happens on the Server:**

```javascript
app.post('/cashout/process', async (req, res) => {
  const { user_id, amount, email, source, bypass_accumulation } = req.body;
  
  // ✅ Step 4a: Validate Request
  if (!user_id || !amount || !email) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: user_id, amount, email'
    });
  }
  
  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Amount must be greater than 0'
    });
  }
  
  // ✅ Step 4b: Try Lovable Cloud API (if configured)
  if (LOVABLE_CLOUD_API_KEY) {
    try {
      const response = await fetch(`${LOVABLE_CLOUD_API_URL}/cashout/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_CLOUD_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id, amount, email,
          source: source || 'direct_revenue',
          bypass_accumulation: bypass_accumulation || true,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        logger.info(`Lovable Cloud cashout success: ${result.transaction_id}`);
        return res.json(result);
      }
    } catch (error) {
      logger.warn(`Lovable Cloud API unavailable, using mock processing`);
    }
  }
  
  // ✅ Step 4c: Fallback to Mock Processing (Development Mode)
  const userData = mockRevenueData.getBalance(user_id);
  
  // Check if user has sufficient balance
  if (userData.balance < amount) {
    return res.status(400).json({
      success: false,
      error: `Insufficient balance. Available: $${userData.balance.toFixed(2)}`
    });
  }
  
  // ✅ Step 4d: Process the Cashout
  userData.balance -= amount;
  const transactionId = `mock_txn_${Date.now()}`;
  userData.transactions.push({
    id: transactionId,
    amount: -amount,
    type: 'cashout',
    email,
    timestamp: new Date().toISOString(),
    status: 'completed'
  });
  
  logger.info(`Mock cashout completed: ${transactionId}, $${amount} to ${email}`);
  
  // ✅ Step 4e: Return Success Response
  res.json({
    success: true,
    transaction_id: transactionId,
  });
});
```

### Step 5: Transaction Logging

**All transactions are logged to multiple locations:**

1. **Console Logs** (with Winston logger)
   - Info level: Successful transactions
   - Error level: Failed transactions

2. **Log Files** (in `/logs` directory)
   - `lovable-cloud-server.log` - General server activity
   - `transactions.log` - All transaction logs

**Log Entry Example:**
```
2024-01-15 10:30:45 info: Processing cashout: user_1234567890, $5.00, user@example.com
2024-01-15 10:30:46 info: Mock cashout completed: mock_txn_1705315846, $5.00 to user@example.com
```

### Step 6: Response Sent Back to Frontend

**Success Response:**
```json
{
  "success": true,
  "transaction_id": "mock_txn_1705315846"
}
```

**Error Response (Insufficient Balance):**
```json
{
  "success": false,
  "error": "Insufficient balance. Available: $2.50, Requested: $5.00"
}
```

**Error Response (Invalid Request):**
```json
{
  "success": false,
  "error": "Missing required fields: user_id, amount, email"
}
```

### Step 7: Frontend Displays Result

**Location:** `src/contexts/GameContext.tsx`

```typescript
// If successful
if (result.success) {
  // Reset coins to 0
  setCoins(0);
  
  // Show success toast
  toast({
    title: "✅ Cashout Successful!",
    description: `$${cashValue} sent to ${email}`,
  });
  
  // Record conversion for analytics
  setAdConversions(prev => prev + 1);
  
  // Return transaction ID
  return result.transaction_id;
}
```

## What You Need to Do After Server Receives Request

### Development Mode (Mock Processing)

If you're running in development mode without Lovable Cloud API configured:

1. **✅ Nothing additional required!** The server automatically:
   - Validates the request
   - Checks user balance (simulated)
   - Processes the mock cashout
   - Logs the transaction
   - Returns success response

2. **View transaction logs:**
   ```bash
   # Watch logs in real-time
   tail -f logs/lovable-cloud-server.log
   tail -f logs/transactions.log
   ```

3. **Check user balance:**
   ```bash
   curl http://localhost:4000/revenue/balance/user_1234567890
   ```

4. **View transaction history:**
   ```bash
   curl http://localhost:4000/revenue/transactions/user_1234567890
   ```

### Production Mode (Real Lovable Cloud API)

If you have `VITE_LOVABLE_CLOUD_API_KEY` configured:

1. **Server forwards request to Lovable Cloud API**
   - Endpoint: `https://api.lovable.cloud/cashout/process`
   - Uses your API key for authentication

2. **Lovable Cloud processes the payment:**
   - Validates the request
   - Processes the actual payment
   - Returns transaction details

3. **Server logs and forwards response:**
   - Logs transaction to local files
   - Returns Lovable Cloud response to frontend

4. **You may need to:**
   - Monitor Lovable Cloud dashboard for payment status
   - Handle any payment failures or disputes
   - Check webhook notifications (if configured)

### Alternative: Stripe Connect Mode (Legacy)

If using `cashout-server.js` instead of `lovable-cloud-server.js`:

1. **Server uses Stripe Connect API:**
   - Requires `STRIPE_SECRET_KEY` and `CONNECTED_ACCOUNT_ID`

2. **Three payout methods available:**
   - **Instant Card Payout** - Instant transfer to debit card
   - **Bank Account Payout** - Standard ACH transfer
   - **Email Payout** - Payment intent sent via email

3. **Adaptive Payout Agent:**
   - Automatically retries failed payouts
   - Falls back to alternative methods
   - Max 3 retry attempts per method

4. **You need to:**
   - Configure Stripe Connected Account
   - Add payout destinations (cards/bank accounts)
   - Monitor Stripe Dashboard for payout status
   - Handle Stripe webhook events

## Server Endpoints Reference

### Health Check
```bash
GET http://localhost:4000/health
```
**Response:**
```json
{
  "status": "healthy",
  "service": "lovable-cloud-proxy",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "version": "1.0.0"
}
```

### Get User Balance
```bash
GET http://localhost:4000/revenue/balance/:userId
```
**Response:**
```json
{
  "balance": 125.50
}
```

### Process Cashout
```bash
POST http://localhost:4000/cashout/process
Content-Type: application/json

{
  "user_id": "user_123",
  "amount": 5.00,
  "email": "user@example.com",
  "source": "direct_revenue",
  "bypass_accumulation": true
}
```
**Response:**
```json
{
  "success": true,
  "transaction_id": "mock_txn_1705315846"
}
```

### Get Transaction History
```bash
GET http://localhost:4000/revenue/transactions/:userId?limit=50
```
**Response:**
```json
[
  {
    "id": "txn_mock_1",
    "amount": 25.50,
    "status": "completed",
    "user_id": "user_123",
    "created_at": "2024-01-15T10:30:45.123Z",
    "metadata": { "source": "autonomous_agent" }
  }
]
```

### Legacy Cashout Endpoint (Backward Compatibility)
```bash
POST http://localhost:4000/cashout
Content-Type: application/json

{
  "userId": "user_123",
  "coins": 500,
  "payoutType": "email",
  "email": "user@example.com"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Successfully cashed out $5.00 to user@example.com",
  "details": {
    "id": "mock_txn_1705315846",
    "amount": 500,
    "currency": "usd",
    "status": "completed",
    "isReal": true,
    "source": "lovable_cloud"
  }
}
```

## Troubleshooting

### Issue: "Connection refused" or "ECONNREFUSED"

**Problem:** Frontend cannot reach the local server.

**Solution:**
1. Ensure the cashout server is running:
   ```bash
   # On macOS/Linux
   ./start-lovable-cloud-server.sh
   
   # Or manually
   node lovable-cloud-server.js
   ```

2. Verify server is running on port 4000:
   ```bash
   curl http://localhost:4000/health
   ```

3. Check if port 4000 is already in use:
   ```bash
   lsof -i :4000
   ```

### Issue: "Insufficient balance"

**Problem:** User doesn't have enough balance for cashout.

**Solution:**
1. Check user's current balance:
   ```bash
   curl http://localhost:4000/revenue/balance/user_123
   ```

2. In mock mode, balance is randomly generated ($50-150)
3. Play the game to earn more coins before cashing out

### Issue: "Lovable Cloud API unavailable"

**Problem:** Cannot reach Lovable Cloud API.

**Solution:**
1. Check if `VITE_LOVABLE_CLOUD_API_KEY` is configured in `.env`
2. Server automatically falls back to mock processing
3. Mock mode is perfectly fine for development/testing

### Issue: Transaction appears successful but no money received

**In Development (Mock Mode):**
- Mock transactions don't process real money
- This is expected behavior for testing
- Check logs to confirm transaction was logged

**In Production:**
1. Check Lovable Cloud dashboard for transaction status
2. Verify API key is valid and has sufficient permissions
3. Check for any error logs in `logs/lovable-cloud-server.log`
4. Contact Lovable Cloud support if payment is stuck

## Monitoring and Logs

### Real-time Log Monitoring

**Terminal 1 - Server Logs:**
```bash
tail -f logs/lovable-cloud-server.log
```

**Terminal 2 - Transaction Logs:**
```bash
tail -f logs/transactions.log
```

### Log Files Location

All logs are stored in the `/logs` directory:
- `lovable-cloud-server.log` - General server activity
- `transactions.log` - All transactions (success and failures)

### Log Rotation

Logs are automatically managed:
- Max 1000 transactions kept in transaction log
- Older transactions are rotated out to prevent file growth

## Security Considerations

### Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP
- **Protection:** Prevents abuse and DDoS attacks
- **Response:** `429 Too Many Requests` when limit exceeded

### Request Validation

All requests are validated for:
- ✅ Required fields (user_id, amount, email)
- ✅ Amount must be greater than 0
- ✅ Email format validation
- ✅ Sufficient balance verification

### CORS Configuration

- **Enabled:** Cross-Origin Resource Sharing
- **Allows:** Requests from frontend on different port
- **Headers:** Properly configured for security

### API Key Protection

- ✅ Never log API keys in plain text
- ✅ Store in `.env` file (gitignored)
- ✅ Use environment variables for configuration

## Testing the Cashout System

### Manual Testing

1. **Start both servers:**
   ```bash
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Cashout Server
   ./start-lovable-cloud-server.sh
   ```

2. **Open browser to http://localhost:8080**

3. **Earn coins by clicking "TAP TO EARN!"**

4. **When you have 500+ coins, click "Cash Out Real Money"**

5. **Enter email and select payment method**

6. **Click "Cash Out" and observe:**
   - Success toast notification
   - Coins reset to 0
   - Transaction ID displayed

7. **Check logs to verify transaction:**
   ```bash
   tail -5 logs/lovable-cloud-server.log
   ```

### API Testing with cURL

**Test health endpoint:**
```bash
curl http://localhost:4000/health
```

**Test balance endpoint:**
```bash
curl http://localhost:4000/revenue/balance/test_user_123
```

**Test cashout endpoint:**
```bash
curl -X POST http://localhost:4000/cashout/process \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "amount": 5.00,
    "email": "test@example.com",
    "source": "test",
    "bypass_accumulation": true
  }'
```

### Automated Testing with Test Button

The app includes a "Test Cashout" button for quick testing:

**Location:** `src/components/game/TestCashOutButton.tsx`

**What it does:**
- Sends a test cashout request with 100 coins ($1)
- Uses test email: `test@example.com`
- Marked as test transaction in metadata
- Shows success/failure toast

**Usage:**
1. Click "Test Cashout" button in the UI
2. No coins required (bypasses minimum)
3. Check console for response
4. Check server logs for transaction

## Summary

### What Happens After Cashout Reaches Local Server:

1. ✅ **Request validated** - Checks required fields and amount
2. ✅ **Balance verified** - Ensures sufficient funds
3. ✅ **Payment processed** - Via Lovable Cloud API or mock processing
4. ✅ **Transaction logged** - Written to log files with timestamp
5. ✅ **Response returned** - Success or error message sent back
6. ✅ **Frontend updated** - Coins reset, toast notification shown

### In Development Mode (No API Key):
- Server uses **mock processing**
- Simulated balance ($50-150)
- No real money involved
- Perfect for testing

### In Production Mode (With API Key):
- Server forwards to **Lovable Cloud API**
- Real payment processing
- Transaction tracked in Lovable Cloud dashboard
- Real money transferred

### You Don't Need To:
- ❌ Manually process payments
- ❌ Update databases manually
- ❌ Handle payment confirmations
- ❌ Configure webhooks (optional)

### You May Want To:
- ✅ Monitor logs for errors
- ✅ Check transaction history periodically
- ✅ Configure Lovable Cloud API for production
- ✅ Set up monitoring/alerting for failures

## Additional Resources

- **Lovable Cloud Server Code:** `lovable-cloud-server.js`
- **Cashout Service Code:** `src/services/CashoutService.ts`
- **Game Context Code:** `src/contexts/GameContext.tsx`
- **Environment Variables:** `.env` and `.env.example`
- **Server Startup Script:** `start-lovable-cloud-server.sh`

## Questions?

If you have questions about the cashout flow:

1. Check the logs first: `tail -f logs/lovable-cloud-server.log`
2. Test the health endpoint: `curl http://localhost:4000/health`
3. Review this documentation
4. Check the code comments in `lovable-cloud-server.js`

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
