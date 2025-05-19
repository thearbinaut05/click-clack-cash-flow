
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
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const stripeLib = require('stripe');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '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';
const OWNER_STRIPE_ACCOUNT_ID = process.env.OWNER_STRIPE_ACCOUNT_ID || 'acct_1RPfy4BRrjIUJ5cS';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_UeZfL3KRrSwZMtkjFR2A1Zo35r9R62Rx';

const stripe = stripeLib(STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json({ verify: (req, res, buf) => { 
  // Needed to verify Stripe webhooks signature
  if (req.originalUrl === '/webhook') {
    req.rawBody = buf.toString();
  }
}}));

app.use(bodyParser.urlencoded({ extended: true }));

// Simple file-based DB emulation
const USERS_FILE = 'users.json';
const OFFERS_FILE = 'offers.json';

// Load or init users DB
let users = {};
if (fs.existsSync(USERS_FILE)) {
  try {
    users = JSON.parse(fs.readFileSync(USERS_FILE));
  } catch(err) {
    console.error('Error loading users.json:', err);
  }
} else {
  fs.writeFileSync(USERS_FILE, JSON.stringify({}));
}

// Save users DB helper
function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Authentication secrets & helpers
const JWT_SECRET = 'change_me_secure_jwt_secret'; // Replace with a secure secret

function generateToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// For this simple example, we'll allow some endpoints without auth
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (!err) {
          req.user = user;
        }
      });
    }
  }
  next();
}

// Routes

// Register new user
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (users[username]) return res.status(409).json({ error: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);

  users[username] = {
    password: hashedPassword,
    earnings: 0,
    payoutHistory: [],
    stripeCustomerId: null,
    stripeAccountId: null // Optional if implementing connected accounts
  };
  saveUsers();

  const token = generateToken(username);
  res.json({ token });
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Invalid credentials' });

  const token = generateToken(username);
  res.json({ token });
});

// Get user data
app.get('/api/userData', authenticateToken, (req, res) => {
  const user = users[req.user.username];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    earnings: user.earnings || 0,
    payoutHistory: user.payoutHistory || []
  });
});

// Endpoint to report earnings (tap clicks)
app.post('/api/earnings', authenticateToken, (req, res) => {
  const { amount } = req.body;
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  const user = users[req.user.username];
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.earnings = (user.earnings || 0) + amount;
  saveUsers();

  res.json({ earnings: user.earnings });
});

// Retrieve offers (stub - to replace with scraper data)
app.get('/api/offers', (req, res) => {
  let offers = [];
  if (fs.existsSync(OFFERS_FILE)) {
    try {
      offers = JSON.parse(fs.readFileSync(OFFERS_FILE));
    } catch(e) {
      console.warn('Error reading offers.json:', e);
    }
  }
  res.json({ offers });
});

// Standard withdrawal - initiate Stripe payout
app.post('/api/withdraw', optionalAuth, async (req, res) => {
  try {
    const { amount, email } = req.body;
    
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Minimum $1 required to withdraw' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Payout amount in cents
    const amountCents = Math.floor(amount * 100);

    // Create a PaymentIntent to transfer funds
    // For simplicity, we create a Transfer to the owner connected account.
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: OWNER_STRIPE_ACCOUNT_ID,
      description: `Payout for user ${email}`
    });

    // Record the transaction
    if (req.user && users[req.user.username]) {
      const user = users[req.user.username];
      // Reset user earnings after successful transfer
      user.payoutHistory = user.payoutHistory || [];
      user.payoutHistory.push({
        amount: amount,
        date: new Date().toISOString(),
        transferId: transfer.id,
        email: email
      });
      user.earnings = 0;
      saveUsers();
    }

    res.json({ 
      success: true,
      message: `Transferred $${(amountCents / 100).toFixed(2)} to your account!`, 
      transferId: transfer.id 
    });
  } catch (error) {
    console.error('Stripe transfer error:', error);
    res.status(500).json({ error: 'Transfer failed: ' + error.message });
  }
});

// Virtual Card Creation
app.post('/api/create-virtual-card', optionalAuth, async (req, res) => {
  try {
    const { email, metadata } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Create a Stripe customer if one doesn't exist
    let customer;
    const customers = await stripe.customers.list({ email, limit: 1 });
    
    if (customers.data.length === 0) {
      customer = await stripe.customers.create({
        email,
        metadata: { ...metadata }
      });
    } else {
      customer = customers.data[0];
    }

    // For demonstration - in real world would use Stripe Issuing API
    // This is a simplified demo version
    const virtualCard = {
      id: `vc_${Date.now()}`,
      last4: `${Math.floor(1000 + Math.random() * 9000)}`,
      customer_id: customer.id,
      created: new Date().toISOString()
    };

    // Record the transaction if user is logged in
    if (req.user && users[req.user.username]) {
      const user = users[req.user.username];
      user.payoutHistory = user.payoutHistory || [];
      user.payoutHistory.push({
        amount: metadata?.amount ? metadata.amount / 100 : 0,
        date: new Date().toISOString(),
        cardId: virtualCard.id,
        email: email,
        type: 'virtual-card'
      });
      user.earnings = 0;
      saveUsers();
    }

    res.json({ 
      success: true, 
      id: virtualCard.id,
      cardDetails: {
        last4: virtualCard.last4
      },
      message: `Virtual card created for ${email}`
    });
  } catch (error) {
    console.error('Virtual card creation error:', error);
    res.status(500).json({ error: 'Virtual card creation failed: ' + error.message });
  }
});

// Bank Card Payout
app.post('/api/process-payout', optionalAuth, async (req, res) => {
  try {
    const { payment_method_id, email, amount, metadata } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!amount || amount < 100) { // Amount in cents
      return res.status(400).json({ error: 'Minimum amount required' });
    }

    // For demonstration - in real world would use Stripe Payouts API
    // Creating a simple transfer record
    const transfer = await stripe.transfers.create({
      amount: amount,
      currency: 'usd',
      destination: OWNER_STRIPE_ACCOUNT_ID, // In production this would be user's connected account
      description: `Bank card payout for user ${email}`
    });

    // Record the transaction if user is logged in
    if (req.user && users[req.user.username]) {
      const user = users[req.user.username];
      user.payoutHistory = user.payoutHistory || [];
      user.payoutHistory.push({
        amount: amount / 100, // Convert cents to dollars
        date: new Date().toISOString(),
        transferId: transfer.id,
        email: email,
        type: 'bank-card'
      });
      user.earnings = 0;
      saveUsers();
    }

    res.json({ 
      success: true, 
      id: transfer.id,
      message: `Bank card transfer initiated for ${email}`
    });
  } catch (error) {
    console.error('Bank card payout error:', error);
    res.status(500).json({ error: 'Bank card payout failed: ' + error.message });
  }
});

// Cashout shortcut endpoint - to handle all cashout types
app.post('/api/cashout', optionalAuth, async (req, res) => {
  try {
    const { amount, email, method } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Minimum $1 required' });
    }

    const amountCents = Math.floor(amount * 100);
    
    // Route to appropriate handler based on method
    if (method === 'virtual-card') {
      // Create virtual card
      const metadata = { amount: amountCents, user_email: email };
      
      // Create a Stripe customer if one doesn't exist
      let customer;
      const customers = await stripe.customers.list({ email, limit: 1 });
      
      if (customers.data.length === 0) {
        customer = await stripe.customers.create({
          email,
          metadata
        });
      } else {
        customer = customers.data[0];
      }

      const virtualCard = {
        id: `vc_${Date.now()}`,
        last4: `${Math.floor(1000 + Math.random() * 9000)}`,
        customer_id: customer.id,
        created: new Date().toISOString()
      };

      // Record transaction
      if (req.user && users[req.user.username]) {
        const user = users[req.user.username];
        user.earnings = 0;
        user.payoutHistory = user.payoutHistory || [];
        user.payoutHistory.push({
          amount,
          date: new Date().toISOString(),
          cardId: virtualCard.id,
          type: 'virtual-card'
        });
        saveUsers();
      }

      return res.json({ 
        success: true, 
        id: virtualCard.id,
        cardDetails: {
          last4: virtualCard.last4
        }
      });
      
    } else if (method === 'bank-card') {
      // Process bank card payout
      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: 'usd',
        destination: OWNER_STRIPE_ACCOUNT_ID, // In production this would be user's account
        description: `Bank card payout for user ${email}`
      });

      // Record transaction
      if (req.user && users[req.user.username]) {
        const user = users[req.user.username];
        user.earnings = 0;
        user.payoutHistory = user.payoutHistory || [];
        user.payoutHistory.push({
          amount,
          date: new Date().toISOString(),
          transferId: transfer.id,
          type: 'bank-card'
        });
        saveUsers();
      }

      return res.json({ success: true, id: transfer.id });
      
    } else {
      // Standard withdrawal
      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: 'usd',
        destination: OWNER_STRIPE_ACCOUNT_ID,
        description: `Standard payout for user ${email}`
      });

      // Record transaction
      if (req.user && users[req.user.username]) {
        const user = users[req.user.username];
        user.earnings = 0;
        user.payoutHistory = user.payoutHistory || [];
        user.payoutHistory.push({
          amount,
          date: new Date().toISOString(),
          transferId: transfer.id,
          type: 'standard'
        });
        saveUsers();
      }

      return res.json({ success: true, transferId: transfer.id });
    }
  } catch (error) {
    console.error('Cashout error:', error);
    res.status(500).json({ error: 'Cashout failed: ' + error.message });
  }
});

// Stripe webhook handler to listen for payment events (optional for your app logic)
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful.`);
      break;
    // Add other event types here
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Serve API docs or home page
app.get('/', (req, res) => {
  res.send('Adaptive Tap Money App backend running. Use /api endpoints.');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
