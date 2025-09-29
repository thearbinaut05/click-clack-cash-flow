#!/bin/bash

# Lovable Cloud Server Startup Script
# Replaces the complex Stripe Connect cashout server with simplified Lovable Cloud integration

echo "🌟 Starting Lovable Cloud Server..."
echo "=================================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to run the server."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp .env.example .env
    echo "✅ Please configure your .env file with proper Lovable Cloud credentials"
fi

# Display configuration
echo "📋 Configuration:"
echo "   - Port: ${PORT:-4000}"
echo "   - Lovable Cloud API URL: ${VITE_LOVABLE_CLOUD_API_URL:-'https://api.lovable.cloud'}"
echo "   - API Key configured: $([ -n "$VITE_LOVABLE_CLOUD_API_KEY" ] && echo "Yes" || echo "No (using mock data)")"
echo ""

# Start the server
echo "🚀 Starting Lovable Cloud Server on port ${PORT:-4000}..."
echo "   Health check: http://localhost:${PORT:-4000}/health"
echo "   Revenue API: http://localhost:${PORT:-4000}/revenue/balance/demo_user"
echo ""
echo "💡 This server replaces the old Stripe Connect cashout-server.js"
echo "   - No more Stripe Connected Accounts required"
echo "   - Direct revenue processing via Lovable Cloud"
echo "   - Simplified payment flow without accumulation"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================================="

node lovable-cloud-server.js