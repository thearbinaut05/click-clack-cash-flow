# Click Clack Cash Flow - GitHub Copilot Instructions

**ALWAYS follow these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Project Overview

Click Clack Cash Flow is an autonomous AI-powered revenue generation system built with React/TypeScript frontend and Node.js backend, featuring:
- Click-based game with real cash-out functionality via Stripe Connect
- Dual server architecture: frontend (port 8080) + cashout server (port 4000)
- Supabase integration with edge functions for autonomous agents
- Autonomous revenue optimization and market analysis
- Real-time financial processing and cash-out system

## Quick Setup & Build Instructions

### Prerequisites & Installation
Always start with these commands in order:
```bash
# Verify Node.js version (requires v14+)
node --version  # Should be v20+ for best compatibility

# Install dependencies - takes ~20 seconds
npm install  # NEVER CANCEL - Wait for completion

# Optional: Fix audit issues (but not required for functionality)
npm audit fix  # Optional - some vulnerabilities are acceptable
```

### Build Process
```bash
# Build the frontend - takes ~5-6 seconds, NEVER CANCEL
npm run build  # Timeout: 60 seconds (actual: ~6s)

# Preview the build (optional)
npm run preview  # Runs on port 4173
```

### Development Servers
Always run BOTH servers for full functionality:

```bash
# Terminal 1: Start frontend development server
npm run dev  # Starts immediately on port 8080 - http://localhost:8080

# Terminal 2: Start cashout server (required for cash-out functionality)
chmod +x start-cashout-server.sh
./start-cashout-server.sh  # Starts on port 4000 with USD sweep automation
```

**TIMING EXPECTATIONS:**
- npm install: ~20 seconds
- npm run build: ~6 seconds  
- npm run dev: Starts in ~300ms
- Cashout server: Starts in ~2 seconds
- NEVER CANCEL any build commands - they complete quickly

## Linting & Code Quality

```bash
# Run linting - takes ~2.5 seconds but WILL SHOW ERRORS
npm run lint  # Current status: 43 errors, 12 warnings

# Known linting issues (do not block functionality):
# - TypeScript @typescript-eslint/no-explicit-any errors
# - React hooks exhaustive-deps warnings  
# - switch statement lexical declaration errors
# These errors exist but don't prevent the app from running
```

**CRITICAL:** The build works and app runs despite lint errors. Only fix lint errors when specifically requested.

## Validation Scenarios

### Essential User Workflows to Test
After making changes, ALWAYS test these scenarios:

1. **Basic Tap Functionality:**
   - Open http://localhost:8080
   - Click the "TAP TO EARN!" button
   - Verify coins increase and stats update
   - Verify game mechanics work (energy, level, multiplier)

2. **Cash-Out System:**
   - Click "Test Cashout" button
   - Verify cashout server responds (check console logs)
   - Confirm success message appears
   - Note: Supabase functions may fail due to network restrictions but local fallback works

3. **Dual Server Operation:**
   - Frontend must run on port 8080
   - Cashout server must run on port 4000
   - Test API endpoint: `curl -X POST http://localhost:4000/cashout -H "Content-Type: application/json" -d '{"userId": "test123", "coins": 100, "payoutType": "email", "email": "test@example.com"}'`

### Environment Configuration
Required .env variables (already configured):
```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..." 
CONNECTED_ACCOUNT_ID="acct_1R4gD2LKSRNiN8vT"

# Supabase Configuration  
SUPABASE_URL="https://tqbybefpnwxukzqkanip.supabase.co"
VITE_SUPABASE_URL="https://tqbybefpnwxukzqkanip.supabase.co"

# Server Configuration
PORT="4000"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,https://click-clack-cash-flow.vercel.app"
```

## Project Structure & Navigation

### Key Files & Directories
- `src/components/game/` - Game components and UI
- `src/contexts/GameContext.tsx` - Core game state management
- `src/services/` - Service layer (CashoutService, AutonomousAgentService)
- `cashout-server.js` - Express server for Stripe Connect integration
- `supabase/functions/` - Edge functions for autonomous agents
- `supabase/config.toml` - Supabase configuration

### Important Code Locations
- Game mechanics: `src/contexts/GameContext.tsx`
- Cash-out logic: `src/services/CashoutService.ts` 
- Autonomous agents: `src/services/AutonomousAgentService.ts`
- Server API: `cashout-server.js`
- Startup scripts: `start-cashout-server.sh` and `start-cashout-server.bat`

## Common Development Tasks

### Making Code Changes
```bash
# After making changes, always:
1. Test both servers still start: npm run dev && ./start-cashout-server.sh
2. Test basic tap functionality in browser
3. Test cash-out system works
4. Only run lint if specifically required: npm run lint
```

### Debugging Issues
```bash
# Check server logs
tail -f logs/cashout-server.log  # Cashout server logs
tail -f logs/transactions.log   # Transaction logs

# Test API connectivity
curl http://localhost:4000/health  # Server health check
curl http://localhost:8080         # Frontend health check
```

### Known Limitations & Workarounds
- **Supabase Functions:** May fail due to network restrictions - app has local fallbacks
- **Lint Errors:** 43 errors exist but don't block functionality
- **Supabase CLI:** Not available in environment - document functions manually if needed
- **External APIs:** Some market data sources blocked - app gracefully degrades

## CI/CD & Deployment
- GitHub Actions workflow: `.github/workflows/static.yml` 
- Builds deploy to GitHub Pages
- No test runner configured - manual testing required
- Lint errors don't block deployment but should be noted

## Technology Stack Reference
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn-ui
- **Backend:** Node.js + Express + Stripe Connect
- **Database:** Supabase (PostgreSQL) with Edge Functions
- **Payment:** Stripe Connect with autonomous USD sweep system
- **Deployment:** Vercel (frontend) + configurable (backend)

## Working Effectively Tips
- Always start both servers for full testing
- Use browser dev tools to monitor console for errors
- Supabase function failures are expected - local fallbacks work
- Test cash-out system after any payment-related changes
- Screenshot the UI after significant changes to show impact

**Remember: The app works despite lint errors. Focus on functionality over perfect code style unless specifically asked to fix linting.**