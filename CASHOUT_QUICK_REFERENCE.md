# Cashout Quick Reference

## TL;DR - What Happens After Cashout Reaches Server?

### In Development Mode (Default)
**✅ Nothing! It's automatic:**
1. Server validates request
2. Checks simulated balance
3. Processes mock cashout
4. Logs to `/logs/` directory
5. Returns success response

**View logs:**
```bash
tail -f logs/lovable-cloud-server.log
```

### In Production Mode
**Server forwards to Lovable Cloud API:**
1. Validates request locally
2. Sends to `https://api.lovable.cloud/cashout/process`
3. Lovable Cloud processes real payment
4. Logs transaction locally
5. Returns response to frontend

**Monitor:** Check Lovable Cloud dashboard

---

## Quick Setup

### 1. Start Servers
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Cashout Server
./start-lovable-cloud-server.sh
```

### 2. Test Cashout
```bash
curl -X POST http://localhost:4000/cashout/process \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","amount":5.00,"email":"test@example.com"}'
```

### 3. Check Health
```bash
curl http://localhost:4000/health
```

---

## Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check server status |
| `/revenue/balance/:userId` | GET | Get user balance |
| `/cashout/process` | POST | Process cashout |
| `/revenue/transactions/:userId` | GET | Get transaction history |

---

## Common Questions

**Q: Do I need to do anything after cashout reaches server?**  
A: No! In dev mode it's automatic. In production, monitor Lovable Cloud dashboard.

**Q: Where are transactions logged?**  
A: `/logs/lovable-cloud-server.log` and `/logs/transactions.log`

**Q: How do I test without real money?**  
A: Just run without `VITE_LOVABLE_CLOUD_API_KEY` - uses mock processing.

**Q: What's the minimum cashout?**  
A: 500 coins = $5 USD

---

📖 **[Read Full Documentation](CASHOUT_FLOW_GUIDE.md)** for complete details, troubleshooting, and architecture overview.
