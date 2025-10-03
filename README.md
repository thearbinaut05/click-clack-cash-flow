# Click Clack Cash Flow

A click-based game with real cash out functionality that allows users to earn real money through CPA, CPL, and PPC affiliate offers.

## 🎉 NEW: Real Affiliate Payment System

**No more Stripe!** The system now generates revenue through actual affiliate networks:
- Complete real offers (surveys, app installs, sign-ups)
- Earn real money tracked in real-time
- Cash out via PayPal or Payoneer
- Works with CPALead, OGAds, AdscendMedia, and more!

📖 **[Read the Quick Start Guide](AFFILIATE_QUICK_START.md)** to get started in 5 minutes!

## Features

- Click-based gameplay with upgrades and power-ups
- **🆕 Real affiliate offer wall** - Complete offers to earn actual money
- **🆕 Multiple affiliate networks** - CPALead, OGAds, AdscendMedia, CPAGrip, OfferToro
- **🆕 Real revenue tracking** - Track CPA, CPL, and PPC earnings
- **🆕 PayPal/Payoneer payouts** - Cash out real earnings (min $5)
- Comprehensive logging and transaction tracking
- Demo mode for testing without API keys

## 💰 Real Affiliate Payment System

### How It Works

1. **Users complete offers** from real affiliate networks (surveys, installs, sign-ups)
2. **Revenue is tracked** in real-time with conversion status
3. **Earnings are approved** by networks (usually within 5 minutes to 24 hours)
4. **Users cash out** via PayPal or Payoneer (minimum $5)

### Supported Networks

- **CPALead** - High-paying CPA offers with instant approval
- **OGAds** - Content locking and CPA offers
- **AdscendMedia** - Premium offer walls with high payouts
- **CPAGrip** - Diverse CPA offers with good fill rates
- **OfferToro** - Survey and mobile offer specialist

### Payout Methods

1. **PayPal** - Instant transfer to PayPal account
2. **Payoneer** - Global payment solution for international users

### Demo Mode

No API keys required! The system includes demo offers for testing:
- Survey Rewards ($0.75)
- Mobile Game Install ($1.50)
- Newsletter Sign-up ($0.50)
- Premium App Trial ($3.00)
- Credit Card Offer ($25.00)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Stripe account with Connect enabled
- Connected Stripe account for payouts

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/thearbinaut05/click-clack-cash-flow.git
   cd click-clack-cash-flow
   ```

2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   # Stripe API Keys
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

   # Connected Account ID for Stripe Connect
   CONNECTED_ACCOUNT_ID=acct_your_connected_account_id

   # Server Configuration
   PORT=4000

   # Logging Configuration
   LOG_LEVEL=info

   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-production-domain.com
   ```

4. Create a `.env.local` file in the root directory for the frontend:
   ```
   VITE_APP_API_URL=http://localhost:4000
   VITE_APP_STRIPE_ACCOUNT_ID=acct_your_connected_account_id
   ```

### Running the Application

1. Start the cashout server:
   ```sh
   # On Windows
   start-cashout-server.bat

   # On macOS/Linux
   ./start-cashout-server.sh
   ```

2. Start the frontend development server:
   ```sh
   npm run dev
   # or
   yarn dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Testing the Cash Out System

1. Play the game to earn coins (100 coins = $1)
2. Click the "Cash Out Real Money" button
3. Enter your email and select a payment method
4. Click "Cash Out" to process the payment

You can also use the "Test Cashout" button to test the system without affecting your coins.

## Stripe Connect Setup

To use the cash out system with Stripe Connect, you need to:

1. Create a Stripe account and enable Connect
2. Create a connected account for payouts
3. Configure the connected account with payout destinations (cards/bank accounts)
4. Set the connected account ID in the `.env` file

## Logs and Monitoring

The cashout server generates comprehensive logs for all transactions:

- `logs/cashout-server.log` - General server logs
- `logs/transactions.log` - Transaction-specific logs
- `logs/error.log` - Error logs
- `logs/transactions.json` - JSON file with transaction details for easier analysis

You can view transaction history by accessing the `/transactions` endpoint on the cashout server.

## Technologies Used

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn-ui
- **Backend**: Node.js, Express
- **Payment Processing**: Stripe Connect
- **Logging**: Winston

## Project Structure

- `src/components/game/` - Game components including CashOutButton and CashOutDialog
- `src/contexts/GameContext.tsx` - Game state management and cashOut function
- `src/utils/constants.ts` - Configuration constants
- `cashout-server.js` - Stripe Connect integration server
- `start-cashout-server.bat/sh` - Server startup scripts

## Deployment

### Frontend

Deploy the frontend to your preferred hosting service (Vercel, Netlify, etc.) and set the environment variables:

```
VITE_APP_API_URL=https://your-cashout-server-url.com
VITE_APP_STRIPE_ACCOUNT_ID=acct_your_connected_account_id
```

### Cashout Server

Deploy the cashout server to a Node.js hosting service (Heroku, DigitalOcean, etc.) and set the environment variables:

```
STRIPE_SECRET_KEY=sk_your_stripe_secret_key
CONNECTED_ACCOUNT_ID=acct_your_connected_account_id
PORT=4000
LOG_LEVEL=info
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn-ui Documentation](https://ui.shadcn.com)

