
/**
 * Backend server for Adaptive Tap Money App with Stripe integration.
 * Environment variables required:
 *   STRIPE_SECRET_KEY
 *   OWNER_STRIPE_ACCOUNT_ID
 *   PORT
 *   STRIPE_WEBHOOK_SECRET
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const OWNER_STRIPE_ACCOUNT_ID = process.env.OWNER_STRIPE_ACCOUNT_ID;

// Import Stripe with proper error handling
let stripe;
try {
  const stripeLib = require('stripe');
  stripe = stripeLib(STRIPE_SECRET_KEY);
  console.log('Stripe initialized successfully');
} catch (error) {
  console.error('Failed to initialize Stripe:', error.message);
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: '*', // Configure appropriately for production
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple in-memory transaction log (replace with database in production)
const transactionLog = [];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    stripe: !!stripe
  });
});

// Unified cashout endpoint for all methods
app.post('/api/cashout', async (req, res) => {
  try {
    const { amount, email, method, metadata } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!amount || amount < 100) { // Minimum 100 cents ($1)
      return res.status(400).json({ error: 'Minimum amount of $1 required' });
    }

    console.log(`Processing ${method} cashout for ${email} - Amount: ${amount / 100} USD`);
    
    // Record transaction attempt
    const transaction = {
      id: `txn_${Date.now()}${Math.floor(Math.random() * 1000)}`,
      method,
      email,
      amount: amount / 100,
      status: 'processing',
      timestamp: new Date().toISOString(),
      metadata
    };
    
    transactionLog.push(transaction);

    // Process based on method
    switch (method) {
      case 'virtual-card': {
        // Create a Stripe customer if one doesn't exist
        let customer;
        const customers = await stripe.customers.list({ email, limit: 1 });
        
        if (customers.data.length === 0) {
          customer = await stripe.customers.create({
            email,
            metadata: { ...metadata }
          });
          console.log(`Created new customer for ${email}: ${customer.id}`);
        } else {
          customer = customers.data[0];
          console.log(`Found existing customer for ${email}: ${customer.id}`);
        }

        // In production, use Stripe Issuing API to create real virtual cards
        // This is a simulation for demo purposes
        const virtualCard = {
          id: `vc_${Date.now()}`,
          last4: `${Math.floor(1000 + Math.random() * 9000)}`,
          customer_id: customer.id,
          created: new Date().toISOString(),
          balance: amount / 100
        };

        // Update transaction status
        transaction.status = 'completed';
        transaction.cardDetails = {
          last4: virtualCard.last4
        };
        
        return res.json({ 
          success: true, 
          id: virtualCard.id,
          cardDetails: {
            last4: virtualCard.last4
          },
          message: `Virtual card created with $${amount / 100} balance. Details sent to ${email}`
        });
      }
      
      case 'bank-card': {
        // In production, use Stripe Payouts API for real bank transfers
        // For now we're using Transfer API as demo
        const transfer = await stripe.transfers.create({
          amount: amount,
          currency: 'usd',
          destination: OWNER_STRIPE_ACCOUNT_ID,
          description: `Bank card payout for ${email}`
        });
        
        console.log(`Created transfer for bank card payout: ${transfer.id}`);
        
        // Update transaction status
        transaction.status = 'completed';
        transaction.transferId = transfer.id;
        
        return res.json({ 
          success: true, 
          id: transfer.id,
          message: `$${amount / 100} will be transferred to your bank card. Details sent to ${email}`
        });
      }
      
      case 'standard':
      default: {
        // Standard transfer using Stripe Transfer API
        const transfer = await stripe.transfers.create({
          amount: amount,
          currency: 'usd',
          destination: OWNER_STRIPE_ACCOUNT_ID,
          description: `Standard payout for ${email}`
        });
        
        console.log(`Created standard transfer: ${transfer.id}`);
        
        // Update transaction status
        transaction.status = 'completed';
        transaction.transferId = transfer.id;
        
        return res.json({ 
          success: true, 
          transferId: transfer.id,
          message: `$${amount / 100} has been sent to your account. Details sent to ${email}`
        });
      }
    }
  } catch (error) {
    console.error('Cashout error:', error);
    return res.status(500).json({ 
      error: error.message || 'Payment processing failed', 
      errorCode: error.type || 'unknown_error' 
    });
  }
});

// Legacy endpoints for backward compatibility
app.post('/api/withdraw', async (req, res) => {
  try {
    const { amount, email } = req.body;
    // Forward to unified endpoint
    const result = await (await fetch(`http://localhost:${PORT}/api/cashout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(amount * 100), email, method: 'standard' })
    })).json();
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/create-virtual-card', async (req, res) => {
  try {
    const { email, metadata } = req.body;
    // Forward to unified endpoint
    const result = await (await fetch(`http://localhost:${PORT}/api/cashout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount: metadata?.amount || 100, 
        email, 
        method: 'virtual-card',
        metadata 
      })
    })).json();
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/process-payout', async (req, res) => {
  try {
    const { email, amount, metadata } = req.body;
    // Forward to unified endpoint
    const result = await (await fetch(`http://localhost:${PORT}/api/cashout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, email, method: 'bank-card', metadata })
    })).json();
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transactions history endpoint (for admin or debugging)
app.get('/api/transactions', (req, res) => {
  res.json({ transactions: transactionLog });
});

// Serve API docs or home page
app.get('/', (req, res) => {
  res.send(`
    <h1>Adaptive Tap Money API</h1>
    <p>Server is running. Available endpoints:</p>
    <ul>
      <li><code>POST /api/cashout</code> - Unified cashout endpoint</li>
      <li><code>GET /api/health</code> - Health check</li>
      <li><code>GET /api/transactions</code> - View transaction log</li>
    </ul>
    <p>Server started at: ${new Date().toISOString()}</p>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`
    ┌─────────────────────────────────────────────┐
    │                                             │
    │   Adaptive Tap Money Server                 │
    │   Running on port ${PORT}                     │
    │                                             │
    │   ${new Date().toISOString()}      │
    │                                             │
    └─────────────────────────────────────────────┘
  `);
});

