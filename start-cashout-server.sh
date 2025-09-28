#!/bin/bash
echo "Starting Cashout Server..."
echo "Ensure you have created a .env file with your Stripe API keys and configuration."

# Make script executable if it isn't already
chmod +x "$(dirname "$0")/start-cashout-server.sh"

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install dotenv express body-parser stripe winston cors helmet express-rate-limit
fi

# Start the server using tsx for TypeScript support
npx tsx cashout-server.ts

