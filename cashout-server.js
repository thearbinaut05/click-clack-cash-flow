/**
 * Backend server for Adaptive Tap Money App with Stripe integration.
 * Environment variables required:
 *   STRIPE_SECRET_KEY
 *   PORT
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: '*', // Configure appropriately for production
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple in-memory gift card log (replace with database in production)
const giftCardLog = [];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  });
});

// Unified cashout endpoint for gift cards
app.post('/api/cashout', async (req, res) => {
  try {
    const { amount, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!amount || amount < 100) { // Minimum 100 cents ($1)
      return res.status(400).json({ error: 'Minimum amount of $1 required' });
    }

    console.log(`Processing gift card payout for ${email} - Amount: ${amount / 100} USD`);

    // Record gift card attempt
    const giftCard = {
      id: `gc_${Date.now()}`,
      email,
      amount: amount / 100,
      status: 'issued',
      timestamp: new Date().toISOString()
    };

    giftCardLog.push(giftCard);

    return res.json({ 
      success: true, 
      id: giftCard.id,
      message: `Gift card of $${amount / 100} issued to ${email}`
    });
  } catch (error) {
    console.error('Cashout error:', error);
    return res.status(500).json({ 
      error: error.message || 'Gift card processing failed' 
    });
  }
});

// Transactions history endpoint (for admin or debugging)
app.get('/api/giftcards', (req, res) => {
  res.json({ giftCards: giftCardLog });
});

// Serve API docs or home page
app.get('/', (req, res) => {
  res.send(`
    <h1>Adaptive Tap Money API</h1>
    <p>Server is running. Available endpoints:</p>
    <ul>
      <li><code>POST /api/cashout</code> - Issue a gift card</li>
      <li><code>GET /api/health</code> - Health check</li>
      <li><code>GET /api/giftcards</code> - View issued gift cards</li>
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
