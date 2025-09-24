#!/usr/bin/env node

/**
 * Production Payout Job - Node.js Stripe Payout Cron Job
 * 
 * This script handles automated Stripe payouts using live secret keys and connected account IDs.
 * Designed for production environments with comprehensive error handling, logging, and monitoring.
 * 
 * Features:
 * - Scheduled payouts via node-cron
 * - Live Stripe API integration
 * - PostgreSQL database integration
 * - Comprehensive logging and monitoring
 * - Error handling with retry logic
 * - Health checks and status reporting
 * - PCI-compliant PaymentMethod ID processing
 * 
 * Usage:
 *   node payout-job.js                    # Run once
 *   node payout-job.js --daemon           # Run as daemon with cron scheduling
 *   node payout-job.js --check-health     # Health check only
 * 
 * Environment Variables Required:
 *   STRIPE_SECRET_KEY_LIVE    - Live Stripe secret key (sk_live_...)
 *   CONNECTED_ACCOUNT_ID      - Stripe connected account ID
 *   DATABASE_URL              - PostgreSQL connection string
 *   PAYOUT_CRON_SCHEDULE      - Cron schedule (default: "0 0/6 * * *" - every 6 hours)
 *   MIN_PAYOUT_AMOUNT         - Minimum payout amount in cents (default: 500 = $5.00)
 *   MAX_RETRY_ATTEMPTS        - Maximum retry attempts for failed payouts (default: 3)
 *   LOG_LEVEL                 - Logging level (default: info)
 */

import dotenv from 'dotenv';
import cron from 'node-cron';
import Stripe from 'stripe';
import winston from 'winston';
import { Client as PgClient } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Configuration
const CONFIG = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY,
  CONNECTED_ACCOUNT_ID: process.env.CONNECTED_ACCOUNT_ID,
  DATABASE_URL: process.env.DATABASE_URL,
  CRON_SCHEDULE: process.env.PAYOUT_CRON_SCHEDULE || '0 */6 * * *', // Every 6 hours
  MIN_PAYOUT_AMOUNT: parseInt(process.env.MIN_PAYOUT_AMOUNT) || 500, // $5.00 in cents
  MAX_RETRY_ATTEMPTS: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  WEBHOOK_URL: process.env.PAYOUT_WEBHOOK_URL, // Optional webhook for notifications
};

// Validate required environment variables
const requiredEnvVars = ['STRIPE_SECRET_KEY', 'CONNECTED_ACCOUNT_ID', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!CONFIG[envVar] && !process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Setup Winston logger
const logger = winston.createLogger({
  level: CONFIG.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'payout-job' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'payout-error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'payout-combined.log') 
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize Stripe
const stripe = new Stripe(CONFIG.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
});

// Initialize PostgreSQL client
const pgClient = new PgClient({
  connectionString: CONFIG.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Metrics tracking
let jobMetrics = {
  lastRunTime: null,
  totalPayoutsProcessed: 0,
  totalAmountProcessed: 0,
  successfulPayouts: 0,
  failedPayouts: 0,
  errors: [],
  uptime: Date.now(),
};

/**
 * Health check function
 */
async function healthCheck() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: Date.now() - jobMetrics.uptime,
    lastRun: jobMetrics.lastRunTime,
    metrics: {
      totalPayouts: jobMetrics.totalPayoutsProcessed,
      successRate: jobMetrics.totalPayoutsProcessed > 0 
        ? (jobMetrics.successfulPayouts / jobMetrics.totalPayoutsProcessed * 100).toFixed(2) + '%'
        : 'N/A',
      totalAmount: `$${(jobMetrics.totalAmountProcessed / 100).toFixed(2)}`,
    },
    configuration: {
      cronSchedule: CONFIG.CRON_SCHEDULE,
      minPayoutAmount: `$${(CONFIG.MIN_PAYOUT_AMOUNT / 100).toFixed(2)}`,
      maxRetryAttempts: CONFIG.MAX_RETRY_ATTEMPTS,
    }
  };

  try {
    // Test database connection
    await pgClient.query('SELECT 1');
    health.database = 'connected';
    
    // Test Stripe connection
    await stripe.accounts.retrieve(CONFIG.CONNECTED_ACCOUNT_ID);
    health.stripe = 'connected';
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    logger.error('Health check failed', { error: error.message });
  }

  return health;
}

/**
 * Get pending payouts from database
 */
async function getPendingPayouts() {
  const query = `
    SELECT 
      id,
      user_id,
      payment_method_id,
      amount_cents,
      currency,
      metadata,
      created_at,
      retry_count
    FROM payout_requests 
    WHERE status = 'pending' 
      AND amount_cents >= $1
      AND retry_count < $2
    ORDER BY created_at ASC
    LIMIT 100
  `;
  
  const result = await pgClient.query(query, [CONFIG.MIN_PAYOUT_AMOUNT, CONFIG.MAX_RETRY_ATTEMPTS]);
  return result.rows;
}

/**
 * Update payout status in database
 */
async function updatePayoutStatus(payoutId, status, stripePayoutId = null, error = null) {
  const query = `
    UPDATE payout_requests 
    SET 
      status = $1,
      stripe_payout_id = $2,
      error_message = $3,
      processed_at = NOW(),
      retry_count = retry_count + 1
    WHERE id = $4
  `;
  
  await pgClient.query(query, [status, stripePayoutId, error, payoutId]);
}

/**
 * Process a single payout using Stripe PaymentMethod ID
 */
async function processPayout(payout) {
  const { id, user_id, payment_method_id, amount_cents, currency, metadata } = payout;
  
  logger.info('Processing payout', { 
    payoutId: id, 
    userId: user_id, 
    amount: amount_cents,
    paymentMethodId: payment_method_id
  });

  try {
    // Create Stripe payout using PaymentMethod ID
    const stripePayoutData = {
      amount: amount_cents,
      currency: currency || 'usd',
      method: 'standard', // or 'instant' for supported payment methods
      statement_descriptor: 'Game Payout',
      metadata: {
        payout_request_id: id.toString(),
        user_id: user_id,
        ...metadata
      }
    };

    // If payment_method_id is provided, it means we're using a specific destination
    if (payment_method_id) {
      // For payouts to specific payment methods, we need to use transfers
      const transfer = await stripe.transfers.create({
        amount: amount_cents,
        currency: currency || 'usd',
        destination: payment_method_id,
        description: `Game payout for user ${user_id}`,
        metadata: stripePayoutData.metadata
      }, {
        stripeAccount: CONFIG.CONNECTED_ACCOUNT_ID
      });
      
      logger.info('Payout successful (transfer)', { 
        payoutId: id, 
        stripeTransferId: transfer.id,
        amount: amount_cents 
      });
      
      await updatePayoutStatus(id, 'completed', transfer.id);
      return { success: true, stripeId: transfer.id };
    } else {
      // Standard payout to connected account's default destination
      const stripePayout = await stripe.payouts.create(stripePayoutData, {
        stripeAccount: CONFIG.CONNECTED_ACCOUNT_ID
      });
      
      logger.info('Payout successful', { 
        payoutId: id, 
        stripePayoutId: stripePayout.id,
        amount: amount_cents 
      });
      
      await updatePayoutStatus(id, 'completed', stripePayout.id);
      return { success: true, stripeId: stripePayout.id };
    }
  } catch (error) {
    logger.error('Payout failed', { 
      payoutId: id, 
      error: error.message,
      stripeCode: error.code 
    });
    
    // Determine if this is a retryable error
    const retryableErrors = ['rate_limit', 'api_connection_error', 'api_error'];
    const isRetryable = retryableErrors.includes(error.code);
    
    await updatePayoutStatus(id, isRetryable ? 'failed_retryable' : 'failed', null, error.message);
    
    jobMetrics.errors.push({
      payoutId: id,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    return { success: false, error: error.message, retryable: isRetryable };
  }
}

/**
 * Send webhook notification (if configured)
 */
async function sendWebhookNotification(data) {
  if (!CONFIG.WEBHOOK_URL) return;
  
  try {
    const response = await fetch(CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PayoutJob/1.0.0'
      },
      body: JSON.stringify({
        event: 'payout_job_completed',
        timestamp: new Date().toISOString(),
        data
      })
    });
    
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
  } catch (error) {
    logger.warn('Webhook notification failed', { error: error.message });
  }
}

/**
 * Main payout processing function
 */
async function processPayouts() {
  const startTime = Date.now();
  jobMetrics.lastRunTime = new Date().toISOString();
  
  logger.info('Starting payout job', { 
    cronSchedule: CONFIG.CRON_SCHEDULE,
    minAmount: CONFIG.MIN_PAYOUT_AMOUNT 
  });
  
  try {
    // Connect to database
    await pgClient.connect();
    
    // Get pending payouts
    const pendingPayouts = await getPendingPayouts();
    logger.info(`Found ${pendingPayouts.length} pending payouts`);
    
    if (pendingPayouts.length === 0) {
      logger.info('No pending payouts to process');
      return;
    }
    
    // Process payouts
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      totalAmount: 0,
      errors: []
    };
    
    for (const payout of pendingPayouts) {
      const result = await processPayout(payout);
      results.processed++;
      jobMetrics.totalPayoutsProcessed++;
      
      if (result.success) {
        results.successful++;
        jobMetrics.successfulPayouts++;
        results.totalAmount += payout.amount_cents;
        jobMetrics.totalAmountProcessed += payout.amount_cents;
      } else {
        results.failed++;
        jobMetrics.failedPayouts++;
        results.errors.push({
          payoutId: payout.id,
          error: result.error
        });
      }
      
      // Add small delay between payouts to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const duration = Date.now() - startTime;
    const summary = {
      ...results,
      duration: `${duration}ms`,
      totalAmountUSD: `$${(results.totalAmount / 100).toFixed(2)}`
    };
    
    logger.info('Payout job completed', summary);
    
    // Send webhook notification
    await sendWebhookNotification(summary);
    
  } catch (error) {
    logger.error('Payout job failed', { error: error.message, stack: error.stack });
    jobMetrics.errors.push({
      type: 'job_failure',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    try {
      await pgClient.end();
    } catch (error) {
      logger.warn('Failed to close database connection', { error: error.message });
    }
  }
}

/**
 * Start the cron job daemon
 */
function startDaemon() {
  logger.info('Starting payout job daemon', { 
    schedule: CONFIG.CRON_SCHEDULE,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone 
  });
  
  // Validate cron expression
  if (!cron.validate(CONFIG.CRON_SCHEDULE)) {
    logger.error('Invalid cron schedule', { schedule: CONFIG.CRON_SCHEDULE });
    process.exit(1);
  }
  
  // Schedule the job
  const task = cron.schedule(CONFIG.CRON_SCHEDULE, processPayouts, {
    scheduled: false,
    timezone: 'UTC'
  });
  
  // Start the task
  task.start();
  logger.info('Payout job daemon started successfully');
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully');
    task.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    task.stop();
    process.exit(0);
  });
  
  // Keep the process alive
  setInterval(() => {
    // Clean up old errors (keep only last 100)
    if (jobMetrics.errors.length > 100) {
      jobMetrics.errors = jobMetrics.errors.slice(-100);
    }
  }, 60000); // Every minute
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--check-health')) {
      const health = await healthCheck();
      console.log(JSON.stringify(health, null, 2));
      process.exit(health.status === 'healthy' ? 0 : 1);
    } else if (args.includes('--daemon')) {
      startDaemon();
    } else {
      // Run once
      await processPayouts();
      process.exit(0);
    }
  } catch (error) {
    logger.error('Payout job startup failed', { error: error.message });
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Start the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { processPayouts, healthCheck, jobMetrics };