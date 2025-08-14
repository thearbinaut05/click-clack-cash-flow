@echo off
echo Starting Cashout Server...
echo Ensure you have created a .env file with your Stripe API keys and configuration.

:: Check if node_modules exists, if not install dependencies
if not exist node_modules (
  echo Installing dependencies...
  npm install dotenv express body-parser stripe winston cors helmet express-rate-limit
)

:: Start the server
node cashout-server.js

