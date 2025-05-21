/**
 * cashout-server.js
 *
 * Real-time Cashout Server using Stripe Connect API.
 * Supports 3 payout types with real Stripe Connect integration:
 * 1. Instant Payout to Connected Account's Debit Card (instant available cards)
 * 2. Standard Payout to Connected Account's Bank Account
 * 3. Email payout simulated via PaymentIntent with receipt sent to email (not a real payout)
 *
 * Features:
 * - 100 coins = 1 USD conversion
 * - Adaptive agent to choose payout method with retry and fallback
 * - Uses environment variables for configuration, including connected account ID and port
 * - Robust error handling, request validation middleware, CORS, and logging
 *
 * Environment Variables:
 * - STRIPE_SECRET_KEY : Your Stripe platform secret key (required)
 * - CONNECTED_ACCOUNT_ID : Default connected Stripe account ID to use for payouts (optional)
 * - PORT : Server port (default 3000)
 *
 * Notes:
 * - Connected Account ID (accountId) can be passed in request body or defaults to CONNECTED_ACCOUNT_ID env.
 * - The connected account must have the payout destinations configured (cards/bank accounts)
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const Stripe = require('stripe');
const winston = require('winston');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware Setup
app.use(helmet()); // Secure HTTP headers
app.use(cors()); // Enable CORS, can be configured for specific origins
app.use(bodyParser.json()); // Parse JSON request bodies

// Rate Limiting Middleware - Limit 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Configuration & Constants
const PORT = process.env.PORT || 4000;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'your_stripe_secret_key_here';
const DEFAULT_CONNECTED_ACCOUNT_ID = process.env.CONNECTED_ACCOUNT_ID || null;

if (stripeSecretKey === 'your_stripe_secret_key_here') {
  console.error('ERROR: Please set your STRIPE_SECRET_KEY in .env file.');
  process.exit(1);
}

if (!DEFAULT_CONNECTED_ACCOUNT_ID) {
  console.warn('Warning: No default CONNECTED_ACCOUNT_ID set in .env. You must provide accountId in each payout request unless using email payout.');
}

const stripe = Stripe(stripeSecretKey);
const COINS_TO_USD = 100;
const MAX_RETRIES = 3;

// Setup Logger with timestamp & colors
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => \`\${timestamp} \${level}: \${message}\`)
  ),
  transports: [new winston.transports.Console()]
});

/**
 * Middleware to validate /cashout POST request body
 */
function validateCashoutRequest(req, res, next) {
  const { userId, coins, payoutType, accountId, email } = req.body;

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).json({ success: false, error: 'Invalid or missing userId.' });
  }

  if (typeof coins !== 'number' || coins < 100) {
    return res.status(400).json({ success: false, error: 'Coins must be a number and at least 100.' });
  }

  // Only require accountId if payoutType is not email
  if ((payoutType !== 'email') && !(accountId || DEFAULT_CONNECTED_ACCOUNT_ID)) {
    return res.status(400).json({ success: false, error: 'Connected Stripe accountId is required for payouts except email payout.' });
  }

  // If payoutType is email, email must be valid string
  if (payoutType === 'email') {
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ success: false, error: 'Valid email is required for email payout.' });
    }
  }

  next();
}

/**
 * Adaptive Agent Logic - decides payout method and manages retries / fallback
 *
 * @param {Object} payoutRequest - Includes payoutType, connected account details, etc.
 * @returns {Promise<Object>} - payout result
 */
async function adaptivePayoutAgent(payoutRequest) {
  const {
    payoutType,
    accountId,
    amountUSD,
    email,
  } = payoutRequest;

  let activeAccountId = accountId || DEFAULT_CONNECTED_ACCOUNT_ID;

  if (!activeAccountId && payoutType !== 'email') {
    return {
      success: false,
      error: 'No connected Stripe accountId provided and no default set in .env.',
    };
  }

  let attempt = 0;
  let payoutResult = null;
  let lastError = null;

  // Define payout method priority based on requested payoutType or fallback order
  // email payout is fallback (simulated)
  const payoutOrder = [];

  if (payoutType) {
    payoutOrder.push(payoutType);
  } else {
    payoutOrder.push('instant_card', 'bank_account', 'email');
  }

  for (const method of payoutOrder) {
    attempt = 0;
    lastError = null;
    while (attempt < MAX_RETRIES) {
      attempt++;
      try {
        logger.info(\`Attempt \${attempt} to payout via \${method} for account \${activeAccountId || 'N/A'}, amount $\${amountUSD.toFixed(2)}\`);

        if (method === 'instant_card') {
          payoutResult = await performInstantCardPayout(activeAccountId, amountUSD);
        } else if (method === 'bank_account') {
          payoutResult = await performBankAccountPayout(activeAccountId, amountUSD);
        } else if (method === 'email') {
          payoutResult = await performEmailPayout(email, amountUSD);
        } else {
          throw new Error(\`Unknown payout method: \${method}\`);
        }

        if (payoutResult.success) {
          logger.info(\`Payout succeeded via \${method} for account \${activeAccountId || 'N/A'}\`);
          return payoutResult;
        } else {
          lastError = new Error(payoutResult.error || 'Unknown payout error');
          logger.warn(\`Payout attempt \${attempt} failed: \${lastError.message}\`);
        }
      } catch (err) {
        lastError = err;
        logger.warn(\`Payout attempt \${attempt} exception: \${err.message}\`);

        // If error is unrecoverable, break retry loop for this method
        if (isUnrecoverableError(err)) break;
        // else retry after delay
        await delay(1000 * attempt);
      }
    }
    logger.warn(\`Payout failed for method \${method} after \${MAX_RETRIES} attempts\`);
  }

  // All payout methods exhausted
  return {
    success: false,
    error: lastError ? lastError.message : 'All payout methods failed',
  };
}

/**
 * Check if an error is unrecoverable (no retries)
 * Can be extended based on error types/stripe codes
 * @param {Error} error
 * @returns {boolean}
 */
function isUnrecoverableError(error) {
  if (!error || !error.raw) return false;
  const unrecoverableCodes = [
    'invalid_request_error',
    'authentication_error',
    'rate_limit_error',
    'account_invalid',
  ];
  return unrecoverableCodes.includes(error.raw.type);
}

/**
 * Delay utility promise
 * @param {number} ms - milliseconds
 * @returns {Promise}
 */
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

/**
 * Perform Instant Payout to Connected Account's Debit Card
 *
 * @param {string} accountId - connected Stripe account ID
 * @param {number} amountUSD - amount in USD
 * @returns {Promise<Object>}
 */
async function performInstantCardPayout(accountId, amountUSD) {
  try {
    if (!accountId) throw new Error('Connected account ID required for instant card payout.');

    // Validate the connected account has instant payout capability
    const account = await stripe.accounts.retrieve(accountId);

    if (!account.capabilities || !account.capabilities.transfers) {
      throw new Error('Connected account does not have transfers capability.');
    }

    // Create a transfer from platform account to connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amountUSD * 100), // amount in cents
      currency: 'usd',
      destination: accountId,
      description: 'Instant card payout transfer',
    });

    // Create a payout from connected account with method 'instant'
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amountUSD * 100),
        currency: 'usd',
        method: 'instant',
      },
      {
        stripeAccount: accountId,
      }
    );

    return {
      success: true,
      message: 'Instant card payout successful.',
      transferId: transfer.id,
      payoutId: payout.id,
    };
  } catch (error) {
    return { success: false, error: error.message || 'Instant card payout failed' };
  }
}

/**
 * Perform Standard Bank Account Payout (ACH)
 * @param {string} accountId
 * @param {number} amountUSD
 * @returns {Promise<Object>}
 */
async function performBankAccountPayout(accountId, amountUSD) {
  try {
    if (!accountId) throw new Error('Connected account ID required for bank account payout.');

    const account = await stripe.accounts.retrieve(accountId);

    if (!account.capabilities || !account.capabilities.transfers) {
      throw new Error('Connected account does not have transfers capability.');
    }

    // Create transfer platform -> connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amountUSD * 100),
      currency: 'usd',
      destination: accountId,
      description: 'Standard bank account payout transfer',
    });

    // Create standard payout from connected account to bank account
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amountUSD * 100),
        currency: 'usd',
        method: 'standard',
      },
      {
        stripeAccount: accountId,
      }
    );

    return {
      success: true,
      message: 'Standard bank account payout successful.',
      transferId: transfer.id,
      payoutId: payout.id,
    };
  } catch (error) {
    return { success: false, error: error.message || 'Bank account payout failed' };
  }
}

/**
 * Perform Email Payout simulation - PaymentIntent with email receipt
 * @param {string} email
 * @param {number} amountUSD
 * @returns {Promise<Object>}
 */
async function performEmailPayout(email, amountUSD) {
  try {
    if (!email) throw new Error('Email required for email payout simulation.');

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountUSD * 100),
      currency: 'usd',
      payment_method_types: ['card'],
      receipt_email: email,
      description: \`Cashout simulated payout to email \${email}\`,
    });

    return {
      success: true,
      message: \`PaymentIntent created to email \${email}\`,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    return { success: false, error: error.message || 'Email payout simulation failed' };
  }
}

// Cashout POST endpoint with validation middleware
app.post('/cashout', validateCashoutRequest, async (req, res) => {
  const { userId, coins, payoutType, accountId: reqAccountId, email } = req.body;

  // Use accountId from request or fallback to default in .env
  const accountId = reqAccountId || DEFAULT_CONNECTED_ACCOUNT_ID;

  const amountUSD = coins / COINS_TO_USD;

  logger.info(\`Received cashout for user \${userId}: coins=\${coins}, payoutType=\${payoutType || 'adaptive'}, amountUSD=$\${amountUSD.toFixed(2)}\`);

  try {
    const payoutResult = await adaptivePayoutAgent({
      payoutType,
      accountId,
      amountUSD,
      email,
    });

    if (payoutResult.success) {
      res.json({
        success: true,
        userId,
        amountUSD,
        payoutMethod: payoutType || 'adaptive',
        details: payoutResult,
      });
    } else {
      logger.error(\`Payout failed for user \${userId}: \${payoutResult.error}\`);
      res.status(500).json({
        success: false,
        userId,
        amountUSD,
        error: payoutResult.error,
      });
    }
  } catch (err) {
    logger.error(\`Unexpected error in cashout for user \${userId}: \${err.message}\`);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(\`
    <h1>Cashout Server - Stripe Connect Integration</h1>
    <p>POST /cashout with JSON body:</p>
    <pre>
{
  "userId": "string",
  "coins": 1000,
  "payoutType": "instant_card" | "bank_account" | "email",
  "accountId": "connected_account_id (optional if default set in .env)",
  "email": "user@example.com (required for email payout)"
}
    </pre>
    <p>100 coins = 1 USD payout conversion.</p>
    <p>Default Connected Account ID from .env: <strong>\${DEFAULT_CONNECTED_ACCOUNT_ID || 'Not set'}</strong></p>
  \`);
});

// Start server
app.listen(PORT, () => {
  logger.info(\`Cashout server running on port \${PORT}\`);
  logger.info('Ensure your .env file has STRIPE_SECRET_KEY and optionally CONNECTED_ACCOUNT_ID set for live payouts.');
});

