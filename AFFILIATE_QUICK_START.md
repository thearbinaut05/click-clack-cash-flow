# Quick Start Guide - Real Affiliate Payments

## What Changed?

✅ **Removed:** Stripe payment processing  
✅ **Added:** Real affiliate network integration (CPA/CPL/PPC)  
✅ **Added:** PayPal/Payoneer payout system  
✅ **Added:** Offer wall for users to complete real offers  
✅ **Added:** Revenue tracking dashboard  

## 5-Minute Setup

### Step 1: Start the Application

```bash
npm install
npm run dev
```

Visit http://localhost:8080

### Step 2: Try Demo Mode (No Setup Required)

1. Scroll to **"Offer Wall - Earn Real Money"**
2. You'll see 5 demo offers:
   - Survey Rewards ($0.75)
   - Mobile Game Install ($1.50)
   - Newsletter Sign-up ($0.50)
   - Premium App Trial ($3.00)
   - Credit Card Offer ($25.00)

3. Click "Start Offer" on any demo offer
4. Wait 30 seconds for simulated conversion
5. Check "Affiliate Revenue Dashboard" to see your earnings
6. Request a demo payout (min $5.00)

### Step 3: Enable Real Offers (Optional)

1. Sign up for an affiliate network:
   - **CPALead:** https://cpalead.com (Recommended for beginners)
   - **OGAds:** https://ogads.com
   - **AdscendMedia:** https://adscendmedia.com

2. Get your API key from the dashboard

3. In the app, find **"Affiliate Network Configuration"**

4. Click "Configure Affiliate Networks (Optional)"

5. Enter your API key and click "Save"

6. Real offers will appear in the Offer Wall!

## How Users Earn Money

### The Flow

```
1. User sees offer wall
   ↓
2. Clicks "Start Offer"
   ↓
3. Completes requirements (survey, install app, sign up, etc.)
   ↓
4. Network tracks conversion
   ↓
5. Earnings appear in dashboard (pending → approved)
   ↓
6. User requests payout via PayPal/Payoneer
   ↓
7. Money sent to their account!
```

### Offer Types

**CPA (Cost Per Action)**
- Complete a full action
- Examples: Install app and reach level 10, sign up for trial
- Payouts: $0.50 - $50.00

**CPL (Cost Per Lead)**
- Submit information
- Examples: Email sign-ups, newsletter subscriptions
- Payouts: $0.25 - $5.00

**PPC (Pay Per Click)**
- Click on advertisement
- Automatic tracking
- Payouts: $0.01 - $0.50

## Revenue Dashboard Features

### Metrics Displayed

1. **Total Earned:** All-time earnings
2. **Pending:** Waiting for network approval
3. **Approved:** Ready for payout
4. **Available:** Can be cashed out now

### Payout Options

- **Minimum:** $5.00
- **Methods:** PayPal or Payoneer
- **Processing:** Instant (demo) or 1-3 days (real)

## Game Integration

### Earning Coins

Users can still earn coins by:
1. **Clicking/Tapping** (original game mechanic)
2. **Completing Offers** (new - real money!)
3. **Conversions** (CPA tracking)

### Cashing Out

The cashout system now:
1. **Checks affiliate balance first** (real money)
2. **Falls back to demo mode** if insufficient real earnings
3. **Prioritizes real payouts** when available

Example:
- User has $10 in affiliate earnings
- User has 1000 coins ($10 demo)
- Cashout uses **real affiliate earnings** first!

## Configuration Options

### Affiliate Network Config

```javascript
// Networks you can configure
const networks = [
  'cpalead',    // CPALead
  'ogads',      // OGAds
  'adscend',    // AdscendMedia
  'cpagrip',    // CPAGrip
  'offertoro'   // OfferToro
];
```

### Minimum Payouts

```javascript
const MIN_PAYOUT = 5.00; // $5 USD minimum
```

### Sync Frequency

```javascript
const SYNC_INTERVAL = 5 * 60 * 1000; // Every 5 minutes
```

## Testing Checklist

### Demo Mode (No API Keys)

- [ ] Offer wall shows 5 demo offers
- [ ] Can click "Start Offer"
- [ ] Conversion tracked after 30 seconds
- [ ] Dashboard shows pending earnings
- [ ] Pending converts to approved after 5 minutes
- [ ] Can request demo payout

### Real Mode (With API Keys)

- [ ] Configure API key for at least one network
- [ ] Real offers appear in offer wall
- [ ] Offers have correct payouts
- [ ] Can complete real offer
- [ ] Conversion tracked in dashboard
- [ ] Status updates from pending to approved
- [ ] Can request real payout

## Troubleshooting

### "No offers showing"
**Fix:** Configure an API key or check network status

### "Conversion not tracked"
**Fix:** Wait 5 minutes for sync, check browser console

### "Payout failed"
**Fix:** Ensure $5 minimum, valid email, sufficient balance

### "API key not working"
**Fix:** Verify key is correct, check network dashboard

## Code Changes Summary

### New Files Created

1. **RealAffiliateNetworkService.ts** - Core affiliate integration
2. **OfferWall.tsx** - Display offers to users
3. **AffiliateRevenueDashboard.tsx** - Track earnings
4. **AffiliateNetworkConfig.tsx** - Configure API keys

### Modified Files

1. **CashoutService.ts** - Now uses affiliate earnings
2. **AdMonetizationService.ts** - Tracks real conversions
3. **Index.tsx** - Added new components

### Key Features

✅ Multi-network support (5 networks)  
✅ Real-time conversion tracking  
✅ Automatic status syncing  
✅ PayPal/Payoneer payouts  
✅ Demo mode for testing  
✅ Comprehensive revenue dashboard  
✅ Secure API key management  

## API Key Storage

Currently using localStorage:
```javascript
localStorage.setItem('affiliate_api_keys', JSON.stringify({
  cpalead: 'your_key',
  ogads: 'your_key'
}));
```

**Production Note:** Move to server-side environment variables for security.

## Example Revenue Calculation

### Scenario 1: Survey Offers
```
100 users × 3 surveys/month × $0.75 payout × 20% conversion
= 100 × 3 × 0.75 × 0.20
= $45/month
```

### Scenario 2: Mixed Offers
```
1000 users × average scenario:
- 2 surveys at $0.75 (20% conversion)
- 1 app install at $1.50 (10% conversion)
- 3 email signups at $0.50 (30% conversion)

Revenue per user = (2 × 0.75 × 0.20) + (1 × 1.50 × 0.10) + (3 × 0.50 × 0.30)
                 = 0.30 + 0.15 + 0.45
                 = $0.90/user/month

1000 users = $900/month
```

## Next Steps

1. ✅ Test demo mode
2. ✅ Sign up for one affiliate network
3. ✅ Configure API key
4. ✅ Test with real offers
5. ✅ Monitor conversions
6. ✅ Request first payout!

## Support Resources

- **Documentation:** REAL_AFFILIATE_PAYMENTS.md
- **Network Support:**
  - CPALead: support@cpalead.com
  - OGAds: support@ogads.com
  - AdscendMedia: support@adscendmedia.com

## Legal Notes

⚠️ **Important:**
- Comply with each network's terms of service
- Don't incentivize offer completion unfairly
- Be transparent with users about earnings
- Follow payment processor requirements
- Report income for tax purposes

## Success Tips

1. **Start with CPALead** - Easiest approval and good payouts
2. **Mix offer types** - Surveys + apps + sign-ups = better conversion
3. **Test offers yourself** - Know what users experience
4. **Monitor metrics** - Track which offers convert best
5. **Scale gradually** - Start small, optimize, then scale

## That's It!

You now have a fully functional affiliate revenue system that generates real money without using Stripe! 🎉

Start with demo mode, then add real networks when ready. Users can earn and cash out actual money through simple offer completions.

Happy earning! 💰
