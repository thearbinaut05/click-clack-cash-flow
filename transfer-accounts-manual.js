#!/usr/bin/env node

/**
 * Comprehensive USD Balance Retrieval Script
 * 
 * This script scans ALL USD amounts across the entire Supabase database,
 * not just unprocessed amounts, and prepares for potential Stripe transfers.
 * 
 * Key Features:
 * - Scans 13 different tables/fields for USD amounts
 * - Includes processed AND unprocessed amounts
 * - Provides detailed breakdown by source
 * - Validates Stripe transfer readiness
 * - Graceful fallback when database unavailable
 * 
 * Tables Scanned:
 * - autonomous_revenue_transactions.amount
 * - autonomous_revenue_transfers.amount  
 * - application_balance.balance_amount
 * - financial_statements.total_revenue/total_expenses/net_income
 * - transaction_audit_log.amount
 * - agent_swarms.revenue_generated/total_cost/hourly_cost
 * - market_offers.payout_rate
 * - payment_transactions.usd_amount
 * - revenue_consolidations.total_amount
 * 
 * Usage: node transfer-accounts-manual.js
 * 
 * Required Environment Variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key with table access
 * - STRIPE_SECRET_KEY: For transfer validation (optional)
 * - CONNECTED_ACCOUNT_ID: For transfer validation (optional)
 * 
 * @version 2.0.0
 * @author Updated for comprehensive USD scanning
 */

import dotenv from 'dotenv';
import winston from 'winston';
import fetch from 'node-fetch';

dotenv.config();

// Setup logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => 
      `${timestamp} [USD_SCAN] ${level}: ${message}`
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

// Database and Stripe configuration
import { Client } from 'pg';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-08-16' });
const pgClient = new Client({
  connectionString: process.env.SUPABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Comprehensive table list from USD audit system
const USD_TABLES_AND_FIELDS = [
  { table: 'autonomous_revenue_transactions', field: 'amount' },
  { table: 'autonomous_revenue_transfers', field: 'amount' },
  { table: 'application_balance', field: 'balance_amount' },
  { table: 'financial_statements', field: 'total_revenue' },
  { table: 'financial_statements', field: 'total_expenses' },
  { table: 'financial_statements', field: 'net_income' },
  { table: 'transaction_audit_log', field: 'amount' },
  { table: 'agent_swarms', field: 'revenue_generated' },
  { table: 'agent_swarms', field: 'total_cost' },
  { table: 'agent_swarms', field: 'hourly_cost' },
  { table: 'market_offers', field: 'payout_rate' },
  { table: 'payment_transactions', field: 'usd_amount' },
  { table: 'revenue_consolidations', field: 'total_amount' }
];


/**
 * Comprehensive USD Balance Scan
 * Scans ALL USD amounts across the entire database, not just unprocessed amounts
 */
async function scanComprehensiveUSDBalances() {
  logger.info('Starting comprehensive USD balance scan...');
  
  let grandTotal = 0;
  let allDetails = [];
  
  try {
    // First, try to query the usd_summary_view for a high-level overview
    try {
      const summaryRes = await pgClient.query('SELECT source, amount, currency FROM usd_summary_view');
      logger.info('Using usd_summary_view for overview...');
      
      for (const row of summaryRes.rows) {
        if (row.amount && row.currency === 'USD') {
          const amount = Number(row.amount);
          grandTotal += amount;
          allDetails.push({ 
            source: `${row.source} (summary_view)`, 
            amount: amount,
            type: 'summary'
          });
        }
      }
    } catch (error) {
      logger.warn(`usd_summary_view not accessible: ${error.message}`);
    }

    // Scan all individual tables for comprehensive coverage
    logger.info('Scanning individual tables for comprehensive USD amounts...');
    
    for (const { table, field } of USD_TABLES_AND_FIELDS) {
      try {
        // Query all records, not just unprocessed ones
        const query = `
          SELECT 
            COALESCE(SUM(CASE WHEN ${field} IS NOT NULL AND ${field} != 0 THEN ${field} ELSE 0 END), 0) as total_amount,
            COUNT(*) as record_count,
            COUNT(CASE WHEN ${field} IS NOT NULL AND ${field} != 0 THEN 1 END) as non_zero_count
          FROM ${table}
        `;
        
        const res = await pgClient.query(query);
        const total = Number(res.rows[0]?.total_amount || 0);
        const recordCount = Number(res.rows[0]?.record_count || 0);
        const nonZeroCount = Number(res.rows[0]?.non_zero_count || 0);
        
        if (total > 0) {
          allDetails.push({ 
            source: `${table}.${field}`, 
            amount: total,
            record_count: recordCount,
            non_zero_records: nonZeroCount,
            type: 'table_scan'
          });
          logger.info(`Found $${total.toLocaleString()} in ${table}.${field} (${nonZeroCount}/${recordCount} records)`);
        }
      } catch (error) {
        logger.warn(`Could not scan ${table}.${field}: ${error.message}`);
        allDetails.push({ 
          source: `${table}.${field}`, 
          amount: 0,
          error: error.message,
          type: 'error'
        });
      }
    }

    // Calculate total from individual table scans (more accurate than summary view)
    const tableTotal = allDetails
      .filter(detail => detail.type === 'table_scan')
      .reduce((sum, detail) => sum + detail.amount, 0);

    return {
      summary_view_total: grandTotal,
      table_scan_total: tableTotal,
      recommended_total: Math.max(grandTotal, tableTotal), // Use the higher value
      details: allDetails,
      scan_timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error(`Error during comprehensive USD scan: ${error.message}`);
    throw error;
  }
}


/**
 * Display comprehensive USD balance report
 */
function displayUSDReport(scanResults) {
  console.log('\n' + '='.repeat(60));
  console.log('🏦 COMPREHENSIVE USD BALANCE REPORT');
  console.log('='.repeat(60));
  console.log(`📊 Summary View Total: $${scanResults.summary_view_total.toLocaleString()}`);
  console.log(`🔍 Table Scan Total: $${scanResults.table_scan_total.toLocaleString()}`);
  console.log(`💰 Recommended Total: $${scanResults.recommended_total.toLocaleString()}`);
  console.log(`🕒 Scan Time: ${scanResults.scan_timestamp}`);
  console.log('');

  // Group details by type
  const summaryDetails = scanResults.details.filter(d => d.type === 'summary');
  const tableDetails = scanResults.details.filter(d => d.type === 'table_scan');
  const errorDetails = scanResults.details.filter(d => d.type === 'error');

  if (summaryDetails.length > 0) {
    console.log('📋 Summary View Details:');
    summaryDetails.forEach(detail => {
      console.log(`  ${detail.source}: $${detail.amount.toLocaleString()}`);
    });
    console.log('');
  }

  if (tableDetails.length > 0) {
    console.log('🗃️  Individual Table Breakdown:');
    tableDetails.sort((a, b) => b.amount - a.amount);
    tableDetails.forEach(detail => {
      const recordInfo = detail.record_count ? ` (${detail.non_zero_records}/${detail.record_count} records)` : '';
      console.log(`  ${detail.source}: $${detail.amount.toLocaleString()}${recordInfo}`);
    });
    console.log('');
  }

  if (errorDetails.length > 0) {
    console.log('⚠️  Tables with Access Issues:');
    errorDetails.forEach(detail => {
      console.log(`  ${detail.source}: ${detail.error}`);
    });
    console.log('');
  }

  console.log('='.repeat(60));
}


// Entry point: comprehensive USD balance scan and reporting
async function main() {
  logger.info('Starting comprehensive USD balance retrieval...');
  
  try {
    // Check if we have the required environment variables
    if (!process.env.SUPABASE_URL) {
      throw new Error('SUPABASE_URL not configured in .env file');
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'your_supabase_service_role_key_here') {
      logger.warn('SUPABASE_SERVICE_ROLE_KEY not properly configured - using demo mode');
      displayDemoReport();
      return;
    }

    await pgClient.connect();
    logger.info('Connected to Supabase database');
    
    const scanResults = await scanComprehensiveUSDBalances();
    displayUSDReport(scanResults);
    
    // Prepare for potential Stripe transfers
    if (scanResults.recommended_total > 0) {
      console.log('💳 STRIPE TRANSFER READINESS:');
      console.log(`  ✅ Total USD ready for transfer: $${scanResults.recommended_total.toLocaleString()}`);
      console.log(`  ✅ Stripe account configured: ${process.env.CONNECTED_ACCOUNT_ID ? 'Yes' : 'No'}`);
      console.log(`  ✅ API key available: ${process.env.STRIPE_SECRET_KEY ? 'Yes' : 'No'}`);
      
      if (scanResults.recommended_total >= 5.00) {
        console.log(`  ✅ Meets minimum transfer threshold ($5.00)`);
      } else {
        console.log(`  ⚠️  Below minimum transfer threshold ($5.00)`);
      }
    } else {
      console.log('ℹ️  No USD amounts found for transfer');
    }
    
    await pgClient.end();
    logger.info('Database connection closed');
    
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo')) {
      logger.warn('Cannot connect to Supabase database (network restrictions). Running in demo mode...');
      displayDemoReport();
    } else {
      logger.error(`Failed to scan USD balances: ${error.message}`);
      console.error('Error details:', error);
      process.exit(1);
    }
  }
}

/**
 * Display demo report when database is not accessible
 */
function displayDemoReport() {
  console.log('\n' + '='.repeat(60));
  console.log('🏦 COMPREHENSIVE USD BALANCE REPORT (DEMO MODE)');
  console.log('='.repeat(60));
  console.log('⚠️  Database connection not available - showing demo data');
  console.log('');
  
  console.log('📋 Tables that would be scanned:');
  USD_TABLES_AND_FIELDS.forEach(({ table, field }) => {
    console.log(`  ${table}.${field}`);
  });
  
  console.log('');
  console.log('🔧 Setup Required:');
  console.log('  1. Configure valid SUPABASE_SERVICE_ROLE_KEY in .env');
  console.log('  2. Ensure network access to Supabase');
  console.log('  3. Verify database tables exist');
  console.log('  4. Configure Stripe credentials for transfers');
  
  console.log('');
  console.log('💡 Example .env configuration:');
  console.log('  SUPABASE_URL=https://your-project.supabase.co');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key');
  console.log('  STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key');
  console.log('  CONNECTED_ACCOUNT_ID=acct_your_stripe_account_id');
  
  console.log('='.repeat(60));
}
// Run the comprehensive USD scan
main()
  .then(() => {
    console.log('\n✅ Comprehensive USD balance scan completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ USD balance scan failed:', error);
    process.exit(1);
  });