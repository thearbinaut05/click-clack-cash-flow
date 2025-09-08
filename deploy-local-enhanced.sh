#!/bin/bash

# Click Clack Cash Flow - Enhanced Local Deployment Script
# Builds and deploys the application with analytics monitoring

set -e  # Exit on any error

echo "🚀 Starting Click Clack Cash Flow Enhanced Deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Start frontend server in background
echo "🌐 Starting frontend server (port 8080)..."
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 3

# Start cashout server
echo "💳 Starting cashout server (port 4000)..."
chmod +x start-cashout-server.sh
./start-cashout-server.sh &
CASHOUT_PID=$!

# Wait for servers to be ready
echo "⏳ Waiting for servers to initialize..."
sleep 5

echo "✅ Deployment complete!"
echo ""
echo "🌟 Click Clack Cash Flow is now running:"
echo "   📱 Frontend: http://localhost:8080"
echo "   💰 Cashout Server: http://localhost:4000"
echo ""
echo "📊 Analytics Options:"
echo "   🔍 Basic Analytics:    npm run analytics"
echo "   🚀 Enhanced Analytics: npm run analytics:enhanced"
echo ""
echo "🎯 To monitor in real-time, run:"
echo "   npm run analytics:monitor"
echo ""
echo "Process IDs:"
echo "   Frontend PID: $FRONTEND_PID"
echo "   Cashout PID: $CASHOUT_PID"
echo ""
echo "🛑 To stop all services:"
echo "   kill $FRONTEND_PID $CASHOUT_PID"