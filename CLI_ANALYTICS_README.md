# Click Clack Cash Flow - CLI Analytics Dashboard

A comprehensive command-line analytics interface for monitoring real-time revenue generation, autonomous agent performance, and system health.

## 🚀 Quick Start

### Installation
```bash
npm install
npm run build
```

### Running Analytics

#### Basic Analytics Dashboard
```bash
npm run analytics
```

#### Enhanced Analytics Dashboard (Recommended)
```bash
npm run analytics:enhanced
```

#### Real-time Monitoring
```bash
npm run analytics:monitor
```

## 📊 Features

### 1. Real-time Revenue Monitor
- **Live revenue tracking** with automatic updates every 5 seconds
- **Transaction analytics** showing success rates and recent transactions
- **Performance indicators** with visual progress bars
- **Trend analysis** with directional indicators
- **Export capabilities** for data analysis

### 2. Autonomous Agent Status
- **Agent fleet overview** with real-time performance metrics
- **Individual agent performance** with efficiency ratings
- **Live activity stream** showing recent agent actions
- **Workload distribution** monitoring
- **Task management** interface

### 3. System Health Dashboard
- **Server status monitoring** (Frontend port 8080, Cashout port 4000)
- **Performance metrics** (CPU, Memory, Uptime)
- **Health indicators** for critical system components
- **Auto-refresh capability** with configurable intervals

### 4. Financial Operations Log
- **Transaction history** with detailed status tracking
- **Automated USD transfers** monitoring
- **Payment processing summary** with success rates
- **Stripe integration** status and balance information

### 5. Market Analytics
- **Market trends** and opportunity detection
- **Performance analytics** with conversion rates
- **Revenue optimization** suggestions
- **Competitive intelligence** insights

### 6. Server Management
- **Start/stop servers** with process management
- **Health check endpoints** testing
- **Restart capabilities** for automated recovery
- **Process monitoring** with PID tracking

### 7. System Diagnostics
- **Comprehensive system checks** across all components
- **Database connectivity** testing
- **File permissions** validation
- **Network connectivity** verification
- **Memory usage** analysis

### 8. Data Export
- **JSON format** for programmatic analysis
- **CSV format** for spreadsheet import
- **TXT reports** for human-readable summaries
- **Full system snapshots** for debugging

## 🎯 Usage Examples

### Monitor Revenue in Real-time
```bash
npm run analytics:enhanced
# Select option 1: Enhanced Revenue Monitor
```

### Check System Health
```bash
npm run analytics:enhanced
# Select option 3: System Health Dashboard
```

### Export Analytics Data
```bash
npm run analytics:enhanced
# Select option 8: Export Analytics Data
```

### Run System Diagnostics
```bash
npm run analytics:enhanced
# Select option 7: System Diagnostics
```

## 🔧 Configuration

### Environment Variables
The CLI analytics tool respects the following environment variables:
- `NODE_ENV` - Environment mode
- `ANALYTICS_REFRESH_RATE` - Refresh interval in milliseconds (default: 5000)

### Server Endpoints
- Frontend Server: `http://localhost:8080`
- Cashout Server: `http://localhost:4000`
- Health Check: `http://localhost:4000/health`

## 📈 Real-time Metrics

### Revenue Metrics
- Total revenue with trend indicators
- Daily and hourly revenue rates
- Transaction success/failure ratios
- Live transaction feed

### Agent Performance
- Active agent count and efficiency ratings
- Task completion statistics
- Performance distribution across agent fleet
- Real-time activity logging

### System Performance
- CPU and memory usage with visual indicators
- System uptime tracking
- Network connectivity status
- Database health monitoring

## 🛠️ Integration with Backend Services

### Cashout Server Integration
The CLI automatically connects to the cashout server's health endpoint:
```
GET http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "stripeConfigured": true,
  "connectedAccountConfigured": true,
  "usd_verification_enabled": true
}
```

### Autonomous Agent Service
Monitors the AutonomousAgentService for:
- Agent performance metrics
- Task completion rates
- Revenue optimization results
- Market analysis data

## 🚨 Troubleshooting

### Common Issues

#### CLI Won't Start
```bash
# Check Node.js version (requires v14+)
node --version

# Reinstall dependencies
npm install

# Verify file permissions
chmod +x cli-analytics-enhanced.cjs
```

#### Server Connection Errors
```bash
# Check if servers are running
npm run dev &          # Frontend server
./start-cashout-server.sh &  # Cashout server

# Verify ports are accessible
curl http://localhost:8080
curl http://localhost:4000/health
```

#### Export Failures
```bash
# Check write permissions in current directory
touch test-file && rm test-file

# Verify disk space
df -h
```

## 📊 Sample Output

### Revenue Monitor Display
```
💰 ENHANCED REAL-TIME REVENUE MONITOR

📈 Revenue Analytics Dashboard (14:32:15) - Auto-refresh: 5s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 Total Revenue:        $12,450.75 📈
📅 Daily Revenue:        $245.50
⏰ Hourly Rate:          $45.25/hr

🔄 Transaction Analytics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Successful:          247 (98.8%)
⏳ Pending:             3
❌ Failed:              2
📊 Total Processed:     252
```

### Agent Status Display
```
🤖 ENHANCED AUTONOMOUS AGENT STATUS

🚀 Agent Fleet Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 Active Agents:       8/12
✅ Tasks Completed:     245 (last hour: 34)
📊 Fleet Efficiency:    89.5%

🎯 Individual Agent Performance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 Revenue Optimizer      ████████████████████ 92.5% (25 tasks)
🟢 Market Analyzer        ████████████████░░░░ 87.3% (18 tasks)
🟢 Financial Processor    ████████████████████ 96.8% (42 tasks)
🟡 Trend Predictor        ██████████████░░░░░░ 76.2% (12 tasks)
```

## 🔮 Future Enhancements

- Real-time notifications for critical events
- Webhook integration for external monitoring
- Custom alert thresholds and rules
- Historical data charting and trends
- Integration with external analytics platforms
- Mobile app companion for remote monitoring

## 📞 Support

For issues or feature requests related to the CLI analytics dashboard:

1. Check the troubleshooting section above
2. Review system diagnostics output
3. Export system snapshot for debugging
4. Check server logs for additional context

## 🏗️ Development

### Adding New Metrics
```javascript
// Add to metrics object in constructor
this.metrics.newMetric = { value: 0, trend: 0 };

// Update in fetchRealMetrics()
await this.fetchNewMetricData();

// Display in relevant dashboard
this.showNewMetricDisplay();
```

### Creating New Dashboard Views
```javascript
async showNewDashboard() {
  this.clearScreen();
  console.log(`${colors.cyan}${colors.bright}NEW DASHBOARD${colors.reset}\n`);
  
  // Implementation here
  
  console.log(`\n${colors.cyan}Press [Enter] to return to main menu${colors.reset}`);
  await this.getInput('');
  this.clearScreen();
  this.showWelcome();
  await this.showMainMenu();
}
```

The CLI analytics dashboard is designed to be extensible and maintainable, with clear separation of concerns and modular functionality.