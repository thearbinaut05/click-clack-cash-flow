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

// Withdraw earnings - initiate Stripe payout
app.post('/api/withdraw', authenticateToken, async (req, res) => {
  const user = users[req.user.username];
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!user.earnings || user.earnings < 1) {
    return res.status(400).json({ error: 'Minimum $1 required to withdraw' });
  }

  // Payout amount in cents
  const amountCents = Math.floor(user.earnings * 100);

  try {
    // Create a PaymentIntent to transfer funds to connected account or your account as needed
    // For simplicity, we create a Transfer to the owner connected account.
    // This assumes you already have the funds in your Stripe balance.

    // Creating payout to connected account (OWNER_STRIPE_ACCOUNT_ID)
    // Note: Transfers work only between Stripe accounts linked via Connect.
    // For external bank accounts, use Payout API with connected account.

    // Create Transfer to connected account
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: OWNER_STRIPE_ACCOUNT_ID,
      description: `Payout for user ${req.user.username}`
    });

    // Reset user earnings after successful transfer
    user.payoutHistory = user.payoutHistory || [];
    user.payoutHistory.push({
      amount: user.earnings,
      date: new Date().toISOString(),
      transferId: transfer.id
    });
    user.earnings = 0;
    saveUsers();

    res.json({ message: `Transferred $${(amountCents / 100).toFixed(2)} to your bank account!`, transferId: transfer.id });
  } catch (error) {
    console.error('Stripe transfer error:', error);
    res.status(500).json({ error: 'Transfer failed: ' + error.message });
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

