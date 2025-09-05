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
import Stripe from 'stripe';
import winston from 'winston';

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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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

// Run the transfer
manualAccountTransfer()
  .then(result => {
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
    
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Transfer failed:', error);
    process.exit(1);
  });