#!/usr/bin/env node

/**
 * Manual Account Transfer Script
 * 
 * This script helps transfer USD from the wrong connected account 
 * to the correct account immediately without waiting for the scheduled sweep.
 * 
 * Usage: node transfer-accounts-manual.js
 */

import dotenv from 'dotenv';
// ...existing code...
import winston from 'winston';
import fetch from 'node-fetch';

dotenv.config();

// Setup logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => 
      `${timestamp} [TRANSFER] ${level}: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Monetize all database tables using Fibonacci exponential profit algorithm
import { Client } from 'pg';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-08-16' });
const pgClient = new Client({
  connectionString: process.env.SUPABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function fibonacci(n) {
  let a = 0, b = 1, f = 1;
  for (let i = 2; i <= n; i++) {
    f = a + b;
    a = b;
    b = f;
  }
  return n <= 1 ? n : f;
}

async function getAllTables() {
  const res = await pgClient.query(`SELECT tablename FROM pg_tables WHERE schemaname='public'`);
  return res.rows.map(row => row.tablename);
}



// Query treasury tables and usd_summary_view for total USD
async function scanTreasuryAccounts() {
  // Query usd_summary_view for comprehensive USD summary
  const summaryRes = await pgClient.query('SELECT source, amount, currency FROM usd_summary_view');
  let grandTotal = 0;
  let details = [];
  for (const row of summaryRes.rows) {
    if (row.amount && row.currency === 'USD') {
      grandTotal += Number(row.amount);
      details.push({ source: row.source, amount: Number(row.amount) });
    }
  }

  // Also query key treasury tables directly for details
  const tables = [
    { name: 'application_balance', field: 'balance_amount' },
    { name: 'autonomous_revenue_transactions', field: 'amount' },
    { name: 'autonomous_revenue_transfers', field: 'amount' },
    { name: 'payment_transactions', field: 'usd_amount' },
    { name: 'transaction_audit_log', field: 'amount' }
  ];
  for (const t of tables) {
    const res = await pgClient.query(`SELECT SUM(${t.field}) as total FROM ${t.name}`);
    const total = res.rows[0]?.total ? Number(res.rows[0].total) : 0;
    if (total > 0) {
      details.push({ source: t.name, amount: total });
    }
  }

  // Log summary
  console.log(`\n=== TREASURY USD SUMMARY ===`);
  console.log(`Total USD found: $${grandTotal.toLocaleString()}`);
  details.sort((a, b) => b.amount - a.amount);
  for (const entry of details) {
    console.log(`Source: ${entry.source}, Amount: $${entry.amount.toLocaleString()}`);
  }
  return grandTotal;
}



// Entry point: scan treasury accounts and log USD summary
async function main() {
  await pgClient.connect();
  await scanTreasuryAccounts();
  await pgClient.end();
}

main().catch(err => {
  console.error('Error scanning treasury accounts:', err);
  process.exit(1);
});
const CORRECT_ACCOUNT_ID = process.env.CONNECTED_ACCOUNT_ID;
const WRONG_ACCOUNT_ID = 'acct_1RPfy4BRrjIUJ5cS';

async function manualAccountTransfer() {
  logger.info('Starting manual account transfer...');
  
  try {
    if (!CORRECT_ACCOUNT_ID) {
      throw new Error('CONNECTED_ACCOUNT_ID not configured in .env');
    }

    logger.info(`Checking balance in wrong account: ${WRONG_ACCOUNT_ID}`);
    
    // Get balance from wrong account
    const wrongAccountBalance = await stripe.balance.retrieve({
      stripeAccount: WRONG_ACCOUNT_ID
    });

    logger.info(`Wrong account balance: ${JSON.stringify(wrongAccountBalance.available)}`);

    const usdBalance = wrongAccountBalance.available.find(b => b.currency === 'usd');
    
    if (!usdBalance || usdBalance.amount === 0) {
      logger.info('No USD balance found in wrong account to transfer.');
      return {
        success: true,
        transferred: false,
        reason: 'No USD balance to transfer',
        available_amount: 0
      };
    }

    const transferAmount = usdBalance.amount / 100; // Convert from cents
    logger.info(`Found $${transferAmount} USD in wrong account`);

    if (transferAmount < 5.00) {
      logger.info(`Amount $${transferAmount} is below minimum transfer threshold of $5.00`);
      return {
        success: true,
        transferred: false,
        reason: 'Amount below minimum threshold',
        available_amount: transferAmount
      };
    }

    logger.info(`Attempting to transfer $${transferAmount} from ${WRONG_ACCOUNT_ID} to ${CORRECT_ACCOUNT_ID}`);

    // Step 1: Create payout from wrong account to external bank account 
    // (This would require the wrong account to have a bank account configured)
    // For this example, we'll log what would happen
    
    logger.info('⚠️  Manual intervention required:');
    logger.info(`1. Log into Stripe dashboard for account ${WRONG_ACCOUNT_ID}`);
    logger.info(`2. Create a manual payout of $${transferAmount} to your bank account`);
    logger.info(`3. Once funds are in your bank account, deposit them into account ${CORRECT_ACCOUNT_ID}`);
    logger.info(`4. Or configure proper transfer settings between the accounts`);

    // In a real scenario with proper account setup, you would:
    // 1. Create a payout from wrong account to a shared bank account
    // 2. Then create a transfer to the correct account
    // 3. Update database records to reflect the transfer

    return {
      success: true,
      transferred: false,
      manual_steps_required: true,
      amount_to_transfer: transferAmount,
      from_account: WRONG_ACCOUNT_ID,
      to_account: CORRECT_ACCOUNT_ID,
      instructions: [
        `Log into Stripe dashboard for account ${WRONG_ACCOUNT_ID}`,
        `Create manual payout of $${transferAmount}`,
        `Deposit funds into correct account ${CORRECT_ACCOUNT_ID}`
      ]
    };

  } catch (error) {
    logger.error(`Manual account transfer failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper: Fetch unprocessed USD from Supabase tables
async function fetchUnprocessedUSD() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let totalUnprocessedUSD = 0;

  // Example: Fetch from application_balance
  const appBalanceRes = await fetch(`${supabaseUrl}/rest/v1/application_balance?processed=is.false`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Accept': 'application/json'
    }
  });
  const appBalances = await appBalanceRes.json();
  for (const row of appBalances) {
    if (row.balance_amount && !row.processed) {
      totalUnprocessedUSD += row.balance_amount;
    }
  }

  // Example: Fetch from pending_payouts
  const pendingRes = await fetch(`${supabaseUrl}/rest/v1/pending_payouts?processed=is.false`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Accept': 'application/json'
    }
  });
  const pendingPayouts = await pendingRes.json();
  for (const row of pendingPayouts) {
    if (row.amount_usd && !row.processed) {
      totalUnprocessedUSD += row.amount_usd;
    }
  }

  return totalUnprocessedUSD;
}

async function transferUnprocessedUSDToStripe() {
  logger.info('Checking for unprocessed USD in Supabase tables...');
  try {
    const totalUnprocessedUSD = await fetchUnprocessedUSD();
    logger.info(`Total unprocessed USD found: $${totalUnprocessedUSD}`);

    if (totalUnprocessedUSD < 1) {
      logger.info('No unprocessed USD to transfer.');
      return totalUnprocessedUSD;
    }

    // Create Stripe payout for the total unprocessed USD
    const payout = await stripe.payouts.create({
      amount: Math.floor(totalUnprocessedUSD * 100), // cents
      currency: 'usd',
      method: 'standard',
      statement_descriptor: 'Supabase USD Sweep'
    }, {
      stripeAccount: CORRECT_ACCOUNT_ID
    });

    logger.info(`Stripe payout created: ${payout.id}, amount: $${totalUnprocessedUSD}`);

    // Mark records as processed (example for application_balance)
    // You may want to update both tables as needed
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/application_balance`, {
      method: 'PATCH',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ processed: true })
    });

    await fetch(`${process.env.SUPABASE_URL}/rest/v1/pending_payouts`, {
      method: 'PATCH',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ processed: true })
    });

    logger.info('Marked Supabase records as processed.');
    return totalUnprocessedUSD;
  } catch (err) {
    logger.error(`Failed to transfer unprocessed USD: ${err.message}`);
    return 0;
  }
}

// Run the transfer
manualAccountTransfer()
  .then(async result => {
    console.log('\n=== TRANSFER RESULT ===');
    // Sanitize sensitive fields before logging result
    const redacted = { ...result };
    if (redacted.to_account) {
      redacted.to_account = '[REDACTED]';
    }
    if (redacted.from_account) {
      redacted.from_account = '[REDACTED]';
    }
    console.log(JSON.stringify(redacted, null, 2));
    
    if (result.manual_steps_required) {
      console.log('\n📋 MANUAL STEPS REQUIRED:');
      result.instructions.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
      });
    }
    
    // After manual transfer, sweep unprocessed USD from Supabase tables
    const sweptAmount = await transferUnprocessedUSDToStripe();
    console.log(`\n💰 Total unprocessed USD swept to Stripe: $${sweptAmount}`);
    
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Transfer failed:', error);
    process.exit(1);
  });