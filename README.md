# Click Clack Cash Flow

A click-based game with real cash out functionality that allows users to convert in-game coins to real money using Stripe Connect.

## Features

- Click-based gameplay with upgrades and power-ups
- Real money cash out system with multiple payout methods
- Stripe Connect integration for processing payments
- Comprehensive logging and transaction tracking
- Multiple payment methods: Standard, Virtual Card, and Bank Card

## Cash Out System

The cash out system allows users to convert their in-game coins to real money using Stripe Connect. The conversion rate is 100 coins = $1 USD.

### Payout Methods

1. **Standard Payment** - Payment sent to user's email via Stripe PaymentIntent
2. **Virtual Card** - Creates a virtual card with the balance using Stripe Connect
3. **Bank Card** - Transfers the balance to the user's bank card using Stripe Connect

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
   # Stripe API Keys - FOR REAL USD CASHOUTS USE LIVE KEYS
   # Get your live keys from https://dashboard.stripe.com/apikeys
   STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_publishable_key

   # Connected Account ID for Stripe Connect
   # Get this from your Stripe Connect dashboard
   CONNECTED_ACCOUNT_ID=acct_your_actual_connected_account_id

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
# IMPORTANT: Use LIVE Stripe keys for real USD cashouts
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key
CONNECTED_ACCOUNT_ID=acct_your_actual_connected_account_id
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

