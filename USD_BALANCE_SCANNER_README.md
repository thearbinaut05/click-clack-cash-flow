# USD Balance Scanner Script

## Overview

The `transfer-accounts-manual.js` script has been updated to provide comprehensive USD balance retrieval across all Supabase database tables. This script scans for **ALL USD amounts**, not just unprocessed ones, and prepares data for potential Stripe transfers.

## Key Features

✅ **Comprehensive Scanning**: Scans all tables with USD fields  
✅ **All USD Amounts**: Retrieves processed and unprocessed USD  
✅ **Stripe Ready**: Prepares data for transfer via Stripe Connect  
✅ **Error Handling**: Graceful fallback when database unavailable  
✅ **Detailed Reporting**: Shows breakdown by table and source  

## Tables Scanned

The script scans the following tables and fields for USD amounts:

| Table | Field | Description |
|-------|-------|-------------|
| `autonomous_revenue_transactions` | `amount` | Autonomous revenue transaction amounts |
| `autonomous_revenue_transfers` | `amount` | Revenue transfer amounts |
| `application_balance` | `balance_amount` | Application balance amounts |
| `financial_statements` | `total_revenue` | Financial statement revenue |
| `financial_statements` | `total_expenses` | Financial statement expenses |
| `financial_statements` | `net_income` | Financial statement net income |
| `transaction_audit_log` | `amount` | Transaction audit log amounts |
| `agent_swarms` | `revenue_generated` | Agent swarm revenue |
| `agent_swarms` | `total_cost` | Agent swarm costs |
| `agent_swarms` | `hourly_cost` | Agent swarm hourly costs |
| `market_offers` | `payout_rate` | Market offer payout rates |
| `payment_transactions` | `usd_amount` | Payment transaction amounts |
| `revenue_consolidations` | `total_amount` | Consolidated revenue amounts |

## Setup Requirements

### Environment Variables

Ensure your `.env` file contains:

```bash
# Supabase Configuration (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# Stripe Configuration (For transfers)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
CONNECTED_ACCOUNT_ID=acct_your_stripe_account_id
```

### Database Access

- Valid Supabase service role key
- Network access to Supabase database
- Proper table permissions for scanning

## Usage

### Basic Usage

```bash
# Run the comprehensive USD balance scan
node transfer-accounts-manual.js
```

### Sample Output

```
============================================================
🏦 COMPREHENSIVE USD BALANCE REPORT
============================================================
📊 Summary View Total: $15,432.50
🔍 Table Scan Total: $15,432.50
💰 Recommended Total: $15,432.50
🕒 Scan Time: 2025-01-20T10:30:15.123Z

🗃️  Individual Table Breakdown:
  autonomous_revenue_transactions.amount: $8,500.00 (145/200 records)
  application_balance.balance_amount: $3,200.75 (1/1 records)
  payment_transactions.usd_amount: $2,500.00 (50/75 records)
  autonomous_revenue_transfers.amount: $1,231.75 (25/25 records)

💳 STRIPE TRANSFER READINESS:
  ✅ Total USD ready for transfer: $15,432.50
  ✅ Stripe account configured: Yes
  ✅ API key available: Yes
  ✅ Meets minimum transfer threshold ($5.00)
============================================================
```

### Demo Mode

When database access is unavailable, the script runs in demo mode:

```
============================================================
🏦 COMPREHENSIVE USD BALANCE REPORT (DEMO MODE)
============================================================
⚠️  Database connection not available - showing demo data

📋 Tables that would be scanned:
  autonomous_revenue_transactions.amount
  autonomous_revenue_transfers.amount
  application_balance.balance_amount
  [... additional tables ...]

🔧 Setup Required:
  1. Configure valid SUPABASE_SERVICE_ROLE_KEY in .env
  2. Ensure network access to Supabase
  3. Verify database tables exist
  4. Configure Stripe credentials for transfers
============================================================
```

## Script Behavior

### What It Does

1. **Connects** to Supabase database using configured credentials
2. **Scans** all specified tables for USD amounts
3. **Aggregates** totals from multiple sources
4. **Reports** comprehensive breakdown of found amounts
5. **Validates** Stripe transfer readiness

### What It Doesn't Do

- **No filtering** by "processed" status - scans ALL USD amounts
- **No automatic transfers** - only prepares data for manual transfer
- **No data modification** - read-only scanning operation

### Error Handling

- **Network Issues**: Falls back to demo mode with setup instructions
- **Missing Tables**: Logs warnings but continues scanning other tables
- **Invalid Data**: Handles null values and non-numeric amounts gracefully
- **Permission Issues**: Reports access problems per table

## Stripe Transfer Preparation

The script validates transfer readiness by checking:

- Total USD amount available
- Minimum transfer threshold ($5.00)
- Stripe account configuration
- API key availability

## Troubleshooting

### Common Issues

**"SUPABASE_SERVICE_ROLE_KEY not properly configured"**
- Update `.env` with your actual service role key
- Ensure key has proper permissions

**"Cannot connect to Supabase database"**
- Check network connectivity
- Verify SUPABASE_URL format
- Confirm service role key is valid

**"Table not found" errors**
- Verify database schema matches expected tables
- Check if tables exist in your Supabase project
- Review table permissions

### Getting Service Role Key

1. Log into your Supabase dashboard
2. Go to Settings → API
3. Copy the "service_role" secret key
4. Add to `.env` as `SUPABASE_SERVICE_ROLE_KEY`

## Integration with Stripe

After scanning, use the reported USD amounts for:

1. **Manual Stripe Transfers**: Create payouts using Stripe dashboard
2. **Automated Systems**: Integrate with existing cashout automation
3. **Financial Reporting**: Track total USD across all sources
4. **Audit Purposes**: Verify USD amounts match expected values

## Security Notes

- Service role key has elevated permissions - keep secure
- Script is read-only - no data modification occurs
- Sensitive account IDs are masked in error outputs
- All database connections use SSL encryption

## Maintenance

### Updating Table List

To add new tables with USD fields:

1. Update `USD_TABLES_AND_FIELDS` array in script
2. Add new table/field combinations
3. Test scanning functionality
4. Update this documentation

### Version History

- **v2.0**: Comprehensive USD scanning (all amounts, not just unprocessed)
- **v1.0**: Original script focused on unprocessed USD only