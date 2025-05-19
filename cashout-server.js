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

// Import Stripe
const stripe = require('stripe')(STRIPE_SECRET_KEY);

// Middleware
app.use(cors({
  origin: '*', // Configure appropriately for production
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  });
});

// Unified cashout endpoint
app.post('/api/cashout', async (req, res) => {
  try {
    const { amount, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!amount || amount < 100) { // Minimum 100 cents ($1)
      return res.status(400).json({ error: 'Minimum amount of $1 required' });
    }

    console.log(`Processing cashout for ${email} - Amount: ${amount / 100} USD`);

    // Create a Stripe customer if one doesn't exist
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customer;

    if (customers.data.length === 0) {
      customer = await stripe.customers.create({ email });
      console.log(`Created new customer for ${email}: ${customer.id}`);
    } else {
      customer = customers.data[0];
      console.log(`Found existing customer for ${email}: ${customer.id}`);
    }

    // Create a payout to the user's bank account
    const payout = await stripe.payouts.create({
      amount: amount,
      currency: 'usd',
      destination: OWNER_STRIPE_ACCOUNT_ID,
      description: `Cashout for ${email}`
    });

    console.log(`Created payout: ${payout.id}`);

    return res.json({ 
      success: true, 
      payoutId: payout.id,
      message: `$${amount / 100} has been sent to your account. Details sent to ${email}`
    });
  } catch (error) {
    console.error('Cashout error:', error);
    return res.status(500).json({ 
      error: error.message || 'Payment processing failed' 
    });
  }
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
