// Clean ESM implementation of cashout server with adaptive payout logic
import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import Stripe from 'stripe';
import winston from 'winston';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// __dirname polyfill for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration & constants
const PORT = process.env.PORT || 4000;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const DEFAULT_CONNECTED_ACCOUNT_ID = process.env.CONNECTED_ACCOUNT_ID || null;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const COINS_TO_USD = 100; // 100 coins = $1
const MAX_RETRIES = 3;

if (!stripeSecretKey || stripeSecretKey === 'your_stripe_secret_key_here' || stripeSecretKey.includes('XXXXX') || stripeSecretKey === 'sk_live_your_actual_stripe_secret_key_here') {
  console.error('FATAL: STRIPE_SECRET_KEY is missing or placeholder. For REAL USD cashouts, update .env with a valid sk_live_ key from your Stripe dashboard.');
  console.error('Visit https://dashboard.stripe.com/apikeys to get your live API keys.');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

// App init
const app = express();

// Logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Logger
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
      )
    }),
    new winston.transports.File({ filename: path.join(logsDir, 'cashout-server.log'), maxsize: 5 * 1024 * 1024, maxFiles: 5 }),
    new winston.transports.File({ filename: path.join(logsDir, 'transactions.log'), level: 'info', maxsize: 5 * 1024 * 1024, maxFiles: 10 }),
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error', maxsize: 5 * 1024 * 1024, maxFiles: 5 })
  ]
});

if (!DEFAULT_CONNECTED_ACCOUNT_ID || DEFAULT_CONNECTED_ACCOUNT_ID === 'acct_your_actual_connected_account_id_here') {
  logger.warn('WARNING: No valid CONNECTED_ACCOUNT_ID configured. For real USD cashouts, set up a Stripe Connect account.');
  logger.warn('Visit https://dashboard.stripe.com/connect/accounts/overview to create a connected account.');
  logger.warn('Non-email payouts will require accountId parameter in requests.');
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => cb(null, true), // adjust for stricter origins if needed
}));
app.use(bodyParser.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }));

// Utility: log transaction
function logTransaction(transaction) {
  const { userId, amountUSD, payoutMethod, status, details, error } = transaction;
  const entry = {
    timestamp: new Date().toISOString(),
    transactionId: details?.payoutId || details?.transferId || details?.paymentIntentId || `tx_${Date.now()}`,
    userId,
    amountUSD,
    payoutMethod,
    status,
    error: error || null
  };
  if (status === 'success') logger.info(`TRANSACTION: ${JSON.stringify(entry)}`); else logger.error(`TRANSACTION FAILED: ${JSON.stringify(entry)}`);
  try {
    const file = path.join(logsDir, 'transactions.json');
    let list = [];
    if (fs.existsSync(file)) list = JSON.parse(fs.readFileSync(file, 'utf8'));
    list.push(entry);
    if (list.length > 1000) list = list.slice(-1000);
    fs.writeFileSync(file, JSON.stringify(list, null, 2));
  } catch (e) {
    logger.error(`Error persisting transaction log: ${e.message}`);
  }
}

// Validation middleware
function validateCashoutRequest(req, res, next) {
  const { userId, coins, payoutType, accountId, email } = req.body;
  if (!userId || typeof userId !== 'string') return res.status(400).json({ success: false, error: 'Invalid userId' });
  if (typeof coins !== 'number' || coins < 100) return res.status(400).json({ success: false, error: 'coins must be >= 100' });
  if (payoutType === 'email') {
    if (!email) return res.status(400).json({ success: false, error: 'email required for email payout' });
  } else if (!(accountId || DEFAULT_CONNECTED_ACCOUNT_ID) && payoutType !== 'email') {
    return res.status(400).json({ success: false, error: 'accountId required for non-email payout' });
  }
  next();
}

function isUnrecoverableError(err) {
  if (!err || !err.raw) return false;
  return ['invalid_request_error', 'authentication_error', 'rate_limit_error', 'account_invalid'].includes(err.raw.type);
}
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// Stripe payout helpers
async function performInstantCardPayout(accountId, amountUSD) {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    if (!account.capabilities?.transfers) throw new Error('Account lacks transfers capability');
    const amount = Math.round(amountUSD * 100);
    const transfer = await stripe.transfers.create({ amount, currency: 'usd', destination: accountId, description: 'Instant card payout transfer' });
    const payout = await stripe.payouts.create({ amount, currency: 'usd', method: 'instant' }, { stripeAccount: accountId });
    return { success: true, message: 'Instant card payout successful', transferId: transfer.id, payoutId: payout.id };
  } catch (e) {
    logger.error(`Instant payout failed: ${e.message}`);
    return { success: false, error: e.message };
  }
}
async function performBankAccountPayout(accountId, amountUSD) {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    if (!account.capabilities?.transfers) throw new Error('Account lacks transfers capability');
    const amount = Math.round(amountUSD * 100);
    const transfer = await stripe.transfers.create({ amount, currency: 'usd', destination: accountId, description: 'Standard bank account payout transfer' });
    const payout = await stripe.payouts.create({ amount, currency: 'usd', method: 'standard' }, { stripeAccount: accountId });
    return { success: true, message: 'Standard bank account payout successful', transferId: transfer.id, payoutId: payout.id };
  } catch (e) {
    logger.error(`Bank payout failed: ${e.message}`);
    return { success: false, error: e.message };
  }
}
async function performEmailPayout(email, amountUSD) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({ amount: Math.round(amountUSD * 100), currency: 'usd', payment_method_types: ['card'], receipt_email: email, description: `Real USD cashout payment to ${email}` });
    return { success: true, message: `PaymentIntent created for ${email}`, paymentIntentId: paymentIntent.id };
  } catch (e) {
    logger.error(`Email payout failed: ${e.message}`);
    return { success: false, error: e.message };
  }
}

async function adaptivePayoutAgent({ payoutType, accountId, amountUSD, email }) {
  const activeAccount = accountId || DEFAULT_CONNECTED_ACCOUNT_ID;
  if (!activeAccount && payoutType !== 'email') return { success: false, error: 'No connected account available.' };
  const order = payoutType ? [payoutType] : ['instant_card', 'bank_account', 'email'];
  let lastError = null;
  for (const method of order) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logger.info(`Attempt ${attempt} via ${method} amount=$${amountUSD.toFixed(2)}`);
        let result;
        if (method === 'instant_card') result = await performInstantCardPayout(activeAccount, amountUSD);
        else if (method === 'bank_account') result = await performBankAccountPayout(activeAccount, amountUSD);
        else if (method === 'email') result = await performEmailPayout(email, amountUSD);
        else throw new Error(`Unknown method ${method}`);
        if (result.success) return result;
        lastError = new Error(result.error || 'Unknown payout failure');
        logger.warn(`Method ${method} attempt ${attempt} failed: ${lastError.message}`);
      } catch (e) {
        lastError = e;
        logger.warn(`Exception ${method} attempt ${attempt}: ${e.message}`);
        if (isUnrecoverableError(e)) break;
      }
      await delay(500 * (attempt));
    }
  }
  return { success: false, error: lastError ? lastError.message : 'All payout methods failed' };
}

// Cashout endpoint
app.post('/cashout', validateCashoutRequest, async (req, res) => {
  const { userId, coins, payoutType, accountId: reqAccountId, email, metadata } = req.body;
  const accountId = reqAccountId || DEFAULT_CONNECTED_ACCOUNT_ID;
  const amountUSD = coins / COINS_TO_USD;
  logger.info(`Cashout request user=${userId} coins=${coins} usd=$${amountUSD.toFixed(2)} payoutType=${payoutType || 'adaptive'}`);
  try {
    const result = await adaptivePayoutAgent({ payoutType, accountId, amountUSD, email });
    if (result.success) {
      logTransaction({ userId, amountUSD, payoutMethod: payoutType || 'adaptive', status: 'success', details: result, metadata });
      return res.json({ success: true, userId, amountUSD, payoutMethod: payoutType || 'adaptive', details: result });
    }
    logTransaction({ userId, amountUSD, payoutMethod: payoutType || 'adaptive', status: 'failed', error: result.error, metadata });
    return res.status(500).json({ success: false, error: result.error });
  } catch (e) {
    logTransaction({ userId, amountUSD, payoutMethod: payoutType || 'adaptive', status: 'error', error: e.message, metadata });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Transactions history
app.get('/transactions', (req, res) => {
  try {
    const file = path.join(logsDir, 'transactions.json');
    if (!fs.existsSync(file)) return res.json({ transactions: [] });
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    res.json({ transactions: data });
  } catch (e) {
    logger.error(`Read transactions failed: ${e.message}`);
    res.status(500).json({ success: false, error: 'Failed to read transactions' });
  }
});

// Health
app.get('/health', (req, res) => {
  const isLiveMode = stripeSecretKey.startsWith('sk_live_');
  const hasValidConnectedAccount = DEFAULT_CONNECTED_ACCOUNT_ID && DEFAULT_CONNECTED_ACCOUNT_ID !== 'acct_your_actual_connected_account_id_here';
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    version: '1.0.0',
    stripeConfigured: true,
    stripeLiveMode: isLiveMode,
    connectedAccountConfigured: hasValidConnectedAccount,
    readyForRealCashouts: isLiveMode && hasValidConnectedAccount,
    coinsToUsdRate: COINS_TO_USD
  });
});

// Root
app.get('/', (req, res) => {
  res.send(`<h1>Cashout Server</h1><p>POST /cashout</p><p>100 coins = $1</p>`);
});

// Start
async function verifyStripeAndStart() {
  try {
    // Basic key validation call
    const acct = await stripe.accounts.retrieve();
    logger.info(`Stripe key valid. Platform account: ${acct.id}`);
    app.listen(PORT, () => logger.info(`Cashout server listening on port ${PORT}`));
  } catch (err) {
    logger.error(`FATAL: Stripe key validation failed: ${err.message}`);
    if (err.message && err.message.toLowerCase().includes('expired')) {
      logger.error('Your Stripe key appears expired. Generate a new secret key in the Stripe Dashboard and update STRIPE_SECRET_KEY in .env.');
    }
    process.exit(1);
  }
}

verifyStripeAndStart();


