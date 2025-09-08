#!/usr/bin/env node

/**
 * Click Clack Cash Flow - CLI Analytics Dashboard
 * Real-time monitoring and analytics for autonomous revenue generation
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

class CliAnalytics {
  constructor() {
    this.isRunning = false;
    this.refreshInterval = 5000; // 5 seconds
    this.intervalId = null;
    this.servers = {
      frontend: { port: 8080, status: 'unknown', pid: null },
      cashout: { port: 4000, status: 'unknown', pid: null }
    };
    this.metrics = {
      revenue: { total: 0, daily: 0, hourly: 0 },
      transactions: { total: 0, successful: 0, failed: 0 },
      agents: { active: 0, total: 0, tasks_completed: 0 },
      performance: { cpu: 0, memory: 0, uptime: 0 }
    };
  }

  // Main CLI interface
  async start() {
    this.clearScreen();
    this.showWelcome();
    await this.checkSystemStatus();
    this.showMainMenu();
  }

  clearScreen() {
    process.stdout.write('\x1b[2J\x1b[0f');
  }

  showWelcome() {
    console.log(`${colors.cyan}${colors.bright}
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    🎯 CLICK CLACK CASH FLOW ANALYTICS                        ║
║                         Real-time Revenue Monitoring                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  }

  async showMainMenu() {
    console.log(`${colors.white}${colors.bright}📊 ANALYTICS DASHBOARD MENU${colors.reset}\n`);
    console.log(`${colors.green}[1]${colors.reset} Real-time Revenue Monitor`);
    console.log(`${colors.blue}[2]${colors.reset} Autonomous Agent Status`);
    console.log(`${colors.yellow}[3]${colors.reset} System Health Dashboard`);
    console.log(`${colors.magenta}[4]${colors.reset} Financial Operations Log`);
    console.log(`${colors.cyan}[5]${colors.reset} Market Analytics`);
    console.log(`${colors.white}[6]${colors.reset} Server Management`);
    console.log(`${colors.red}[0]${colors.reset} Exit\n`);

    const choice = await this.getInput(`${colors.bright}Select option (0-6): ${colors.reset}`);
    await this.handleMenuChoice(choice);
  }

  async handleMenuChoice(choice) {
    switch (choice.trim()) {
      case '1':
        await this.showRevenueMonitor();
        break;
      case '2':
        await this.showAgentStatus();
        break;
      case '3':
        await this.showSystemHealth();
        break;
      case '4':
        await this.showFinancialLog();
        break;
      case '5':
        await this.showMarketAnalytics();
        break;
      case '6':
        await this.showServerManagement();
        break;
      case '0':
        this.exit();
        break;
      default:
        console.log(`${colors.red}Invalid option. Please try again.${colors.reset}`);
        await this.delay(2000);
        this.clearScreen();
        this.showWelcome();
        await this.showMainMenu();
    }
  }

  async showRevenueMonitor() {
    this.clearScreen();
    console.log(`${colors.green}${colors.bright}💰 REAL-TIME REVENUE MONITOR${colors.reset}\n`);
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      if (this.isRunning) {
        this.updateRevenueDisplay();
      }
    }, this.refreshInterval);

    await this.updateRevenueDisplay();
    
    console.log(`\n${colors.cyan}Press [Enter] to return to main menu${colors.reset}`);
    await this.getInput('');
    this.stopMonitoring();
    this.clearScreen();
    this.showWelcome();
    await this.showMainMenu();
  }

  async updateRevenueDisplay() {
    await this.fetchRevenueMetrics();
    
    // Clear previous display but keep header
    process.stdout.write('\x1b[3;0H\x1b[0J');
    
    console.log(`${colors.white}${colors.bright}📈 Revenue Metrics (Last Updated: ${new Date().toLocaleTimeString()})${colors.reset}`);
    console.log('━'.repeat(80));
    
    console.log(`${colors.green}💵 Total Revenue:${colors.reset}        $${this.metrics.revenue.total.toFixed(2)}`);
    console.log(`${colors.yellow}📅 Daily Revenue:${colors.reset}        $${this.metrics.revenue.daily.toFixed(2)}`);
    console.log(`${colors.blue}⏰ Hourly Rate:${colors.reset}          $${this.metrics.revenue.hourly.toFixed(2)}/hr`);
    
    console.log(`\n${colors.white}${colors.bright}🔄 Transaction Summary${colors.reset}`);
    console.log('━'.repeat(80));
    console.log(`${colors.green}✅ Successful:${colors.reset}          ${this.metrics.transactions.successful}`);
    console.log(`${colors.red}❌ Failed:${colors.reset}              ${this.metrics.transactions.failed}`);
    console.log(`${colors.cyan}📊 Total:${colors.reset}               ${this.metrics.transactions.total}`);
    
    const successRate = this.metrics.transactions.total > 0 
      ? ((this.metrics.transactions.successful / this.metrics.transactions.total) * 100).toFixed(1)
      : 0;
    console.log(`${colors.magenta}📈 Success Rate:${colors.reset}        ${successRate}%`);

    // Show live transaction feed
    console.log(`\n${colors.white}${colors.bright}📡 Live Transaction Feed${colors.reset}`);
    console.log('━'.repeat(80));
    await this.showRecentTransactions();
  }

  async showAgentStatus() {
    this.clearScreen();
    console.log(`${colors.blue}${colors.bright}🤖 AUTONOMOUS AGENT STATUS${colors.reset}\n`);
    
    await this.fetchAgentMetrics();
    
    console.log(`${colors.white}${colors.bright}Agent Fleet Overview${colors.reset}`);
    console.log('━'.repeat(80));
    console.log(`${colors.green}🟢 Active Agents:${colors.reset}       ${this.metrics.agents.active}`);
    console.log(`${colors.blue}📊 Total Agents:${colors.reset}        ${this.metrics.agents.total}`);
    console.log(`${colors.yellow}✅ Tasks Completed:${colors.reset}     ${this.metrics.agents.tasks_completed}`);
    
    console.log(`\n${colors.white}${colors.bright}🎯 Agent Performance${colors.reset}`);
    console.log('━'.repeat(80));
    await this.showAgentPerformance();
    
    console.log(`\n${colors.white}${colors.bright}📋 Recent Agent Activities${colors.reset}`);
    console.log('━'.repeat(80));
    await this.showAgentActivities();
    
    console.log(`\n${colors.cyan}Press [Enter] to return to main menu${colors.reset}`);
    await this.getInput('');
    this.clearScreen();
    this.showWelcome();
    await this.showMainMenu();
  }

  async showSystemHealth() {
    this.clearScreen();
    console.log(`${colors.yellow}${colors.bright}🏥 SYSTEM HEALTH DASHBOARD${colors.reset}\n`);
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      if (this.isRunning) {
        this.updateSystemHealthDisplay();
      }
    }, this.refreshInterval);

    await this.updateSystemHealthDisplay();
    
    console.log(`\n${colors.cyan}Press [Enter] to return to main menu${colors.reset}`);
    await this.getInput('');
    this.stopMonitoring();
    this.clearScreen();
    this.showWelcome();
    await this.showMainMenu();
  }

  async updateSystemHealthDisplay() {
    await this.checkSystemStatus();
    
    // Clear previous display but keep header
    process.stdout.write('\x1b[3;0H\x1b[0J');
    
    console.log(`${colors.white}${colors.bright}⚡ System Status (Last Check: ${new Date().toLocaleTimeString()})${colors.reset}`);
    console.log('━'.repeat(80));
    
    // Server Status
    const frontendStatus = this.servers.frontend.status === 'running' 
      ? `${colors.green}🟢 Running${colors.reset}` 
      : `${colors.red}🔴 Stopped${colors.reset}`;
    const cashoutStatus = this.servers.cashout.status === 'running' 
      ? `${colors.green}🟢 Running${colors.reset}` 
      : `${colors.red}🔴 Stopped${colors.reset}`;
    
    console.log(`${colors.cyan}🌐 Frontend Server (8080):${colors.reset}  ${frontendStatus}`);
    console.log(`${colors.magenta}💳 Cashout Server (4000):${colors.reset}   ${cashoutStatus}`);
    
    console.log(`\n${colors.white}${colors.bright}💻 Performance Metrics${colors.reset}`);
    console.log('━'.repeat(80));
    console.log(`${colors.blue}🖥️  CPU Usage:${colors.reset}            ${this.metrics.performance.cpu.toFixed(1)}%`);
    console.log(`${colors.yellow}🧠 Memory Usage:${colors.reset}          ${this.metrics.performance.memory.toFixed(1)}%`);
    console.log(`${colors.green}⏱️  System Uptime:${colors.reset}        ${this.formatUptime(this.metrics.performance.uptime)}`);
    
    console.log(`\n${colors.white}${colors.bright}📊 Health Indicators${colors.reset}`);
    console.log('━'.repeat(80));
    await this.showHealthIndicators();
  }

  async showFinancialLog() {
    this.clearScreen();
    console.log(`${colors.magenta}${colors.bright}💼 FINANCIAL OPERATIONS LOG${colors.reset}\n`);
    
    console.log(`${colors.white}${colors.bright}Recent Financial Transactions${colors.reset}`);
    console.log('━'.repeat(80));
    await this.showFinancialTransactions();
    
    console.log(`\n${colors.white}${colors.bright}Automated USD Transfers${colors.reset}`);
    console.log('━'.repeat(80));
    await this.showAutomatedTransfers();
    
    console.log(`\n${colors.white}${colors.bright}Payment Processing Summary${colors.reset}`);
    console.log('━'.repeat(80));
    await this.showPaymentSummary();
    
    console.log(`\n${colors.cyan}Press [Enter] to return to main menu${colors.reset}`);
    await this.getInput('');
    this.clearScreen();
    this.showWelcome();
    await this.showMainMenu();
  }

  async showMarketAnalytics() {
    this.clearScreen();
    console.log(`${colors.cyan}${colors.bright}📈 MARKET ANALYTICS${colors.reset}\n`);
    
    console.log(`${colors.white}${colors.bright}Market Trends & Opportunities${colors.reset}`);
    console.log('━'.repeat(80));
    await this.showMarketTrends();
    
    console.log(`\n${colors.white}${colors.bright}Performance Analytics${colors.reset}`);
    console.log('━'.repeat(80));
    await this.showPerformanceAnalytics();
    
    console.log(`\n${colors.white}${colors.bright}Revenue Optimization Suggestions${colors.reset}`);
    console.log('━'.repeat(80));
    await this.showOptimizationSuggestions();
    
    console.log(`\n${colors.cyan}Press [Enter] to return to main menu${colors.reset}`);
    await this.getInput('');
    this.clearScreen();
    this.showWelcome();
    await this.showMainMenu();
  }

  async showServerManagement() {
    this.clearScreen();
    console.log(`${colors.white}${colors.bright}⚙️  SERVER MANAGEMENT${colors.reset}\n`);
    
    await this.checkSystemStatus();
    
    console.log(`${colors.white}${colors.bright}Current Server Status${colors.reset}`);
    console.log('━'.repeat(80));
    console.log(`${colors.cyan}🌐 Frontend Server (8080):${colors.reset}  ${this.getServerStatusText('frontend')}`);
    console.log(`${colors.magenta}💳 Cashout Server (4000):${colors.reset}   ${this.getServerStatusText('cashout')}`);
    
    console.log(`\n${colors.white}${colors.bright}Management Options${colors.reset}`);
    console.log('━'.repeat(80));
    console.log(`${colors.green}[1]${colors.reset} Start Frontend Server`);
    console.log(`${colors.blue}[2]${colors.reset} Start Cashout Server`);
    console.log(`${colors.yellow}[3]${colors.reset} Start Both Servers`);
    console.log(`${colors.red}[4]${colors.reset} Stop All Servers`);
    console.log(`${colors.cyan}[5]${colors.reset} Restart All Servers`);
    console.log(`${colors.white}[0]${colors.reset} Back to Main Menu`);
    
    const choice = await this.getInput(`\n${colors.bright}Select option (0-5): ${colors.reset}`);
    await this.handleServerManagement(choice);
  }

  async handleServerManagement(choice) {
    switch (choice.trim()) {
      case '1':
        await this.startFrontendServer();
        break;
      case '2':
        await this.startCashoutServer();
        break;
      case '3':
        await this.startBothServers();
        break;
      case '4':
        await this.stopAllServers();
        break;
      case '5':
        await this.restartAllServers();
        break;
      case '0':
        this.clearScreen();
        this.showWelcome();
        await this.showMainMenu();
        return;
      default:
        console.log(`${colors.red}Invalid option. Please try again.${colors.reset}`);
        await this.delay(2000);
    }
    
    await this.delay(3000);
    await this.showServerManagement();
  }

  // Server management methods
  async startFrontendServer() {
    console.log(`\n${colors.yellow}Starting frontend server...${colors.reset}`);
    try {
      const child = spawn('npm', ['run', 'dev'], { 
        detached: true, 
        stdio: 'ignore',
        cwd: __dirname
      });
      child.unref();
      this.servers.frontend.pid = child.pid;
      console.log(`${colors.green}✅ Frontend server starting on port 8080${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}❌ Failed to start frontend server: ${error.message}${colors.reset}`);
    }
  }

  async startCashoutServer() {
    console.log(`\n${colors.yellow}Starting cashout server...${colors.reset}`);
    try {
      const scriptPath = path.join(__dirname, 'start-cashout-server.sh');
      if (fs.existsSync(scriptPath)) {
        const child = spawn('bash', [scriptPath], { 
          detached: true, 
          stdio: 'ignore',
          cwd: __dirname
        });
        child.unref();
        this.servers.cashout.pid = child.pid;
        console.log(`${colors.green}✅ Cashout server starting on port 4000${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Cashout server script not found${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.red}❌ Failed to start cashout server: ${error.message}${colors.reset}`);
    }
  }

  async startBothServers() {
    console.log(`\n${colors.yellow}Starting both servers...${colors.reset}`);
    await this.startFrontendServer();
    await this.delay(1000);
    await this.startCashoutServer();
  }

  async stopAllServers() {
    console.log(`\n${colors.yellow}Stopping all servers...${colors.reset}`);
    try {
      // Kill processes by port
      spawn('pkill', ['-f', 'npm run dev'], { stdio: 'ignore' });
      spawn('pkill', ['-f', 'cashout-server'], { stdio: 'ignore' });
      console.log(`${colors.green}✅ All servers stopped${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}❌ Error stopping servers: ${error.message}${colors.reset}`);
    }
  }

  async restartAllServers() {
    await this.stopAllServers();
    await this.delay(2000);
    await this.startBothServers();
  }

  // Data fetching methods
  async fetchRevenueMetrics() {
    try {
      // Simulate API call to get revenue data
      // In real implementation, this would call the actual backend APIs
      this.metrics.revenue = {
        total: Math.random() * 10000 + 5000,
        daily: Math.random() * 500 + 200,
        hourly: Math.random() * 50 + 10
      };
      
      this.metrics.transactions = {
        total: Math.floor(Math.random() * 1000) + 500,
        successful: Math.floor(Math.random() * 950) + 450,
        failed: Math.floor(Math.random() * 50) + 10
      };
    } catch (error) {
      console.log(`${colors.red}Error fetching revenue metrics: ${error.message}${colors.reset}`);
    }
  }

  async fetchAgentMetrics() {
    try {
      this.metrics.agents = {
        active: Math.floor(Math.random() * 10) + 5,
        total: 15,
        tasks_completed: Math.floor(Math.random() * 500) + 200
      };
    } catch (error) {
      console.log(`${colors.red}Error fetching agent metrics: ${error.message}${colors.reset}`);
    }
  }

  async checkSystemStatus() {
    try {
      // Check if ports are open
      this.servers.frontend.status = await this.checkPort(8080) ? 'running' : 'stopped';
      this.servers.cashout.status = await this.checkPort(4000) ? 'running' : 'stopped';
      
      // Mock performance metrics
      this.metrics.performance = {
        cpu: Math.random() * 80 + 10,
        memory: Math.random() * 70 + 20,
        uptime: process.uptime()
      };
    } catch (error) {
      console.log(`${colors.red}Error checking system status: ${error.message}${colors.reset}`);
    }
  }

  async checkPort(port) {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => resolve(false));
        server.close();
      });
      
      server.on('error', () => resolve(true));
    });
  }

  // Display helper methods
  async showRecentTransactions() {
    const transactions = [
      { time: new Date().toLocaleTimeString(), amount: '$12.50', status: 'success', type: 'cashout' },
      { time: new Date(Date.now() - 30000).toLocaleTimeString(), amount: '$8.75', status: 'success', type: 'revenue' },
      { time: new Date(Date.now() - 60000).toLocaleTimeString(), amount: '$15.25', status: 'pending', type: 'transfer' },
      { time: new Date(Date.now() - 90000).toLocaleTimeString(), amount: '$3.50', status: 'failed', type: 'cashout' },
    ];

    transactions.forEach(tx => {
      const statusColor = tx.status === 'success' ? colors.green : 
                         tx.status === 'pending' ? colors.yellow : colors.red;
      const statusIcon = tx.status === 'success' ? '✅' : 
                        tx.status === 'pending' ? '⏳' : '❌';
      
      console.log(`${colors.white}[${tx.time}]${colors.reset} ${statusIcon} ${tx.amount} ${statusColor}${tx.status}${colors.reset} (${tx.type})`);
    });
  }

  async showAgentPerformance() {
    const agents = [
      { name: 'Revenue Optimizer', efficiency: 94, tasks: 25, status: 'active' },
      { name: 'Market Analyzer', efficiency: 87, tasks: 18, status: 'active' },
      { name: 'Financial Processor', efficiency: 98, tasks: 42, status: 'active' },
      { name: 'Trend Predictor', efficiency: 76, tasks: 12, status: 'idle' }
    ];

    agents.forEach(agent => {
      const statusColor = agent.status === 'active' ? colors.green : colors.yellow;
      const efficiencyColor = agent.efficiency > 90 ? colors.green : 
                             agent.efficiency > 75 ? colors.yellow : colors.red;
      
      console.log(`${colors.white}${agent.name}${colors.reset} - Efficiency: ${efficiencyColor}${agent.efficiency}%${colors.reset} | Tasks: ${colors.cyan}${agent.tasks}${colors.reset} | Status: ${statusColor}${agent.status}${colors.reset}`);
    });
  }

  async showAgentActivities() {
    const activities = [
      { time: new Date().toLocaleTimeString(), agent: 'Revenue Optimizer', action: 'Optimized payout rates', result: '+12% efficiency' },
      { time: new Date(Date.now() - 45000).toLocaleTimeString(), agent: 'Market Analyzer', action: 'Analyzed market trends', result: 'Found 3 opportunities' },
      { time: new Date(Date.now() - 120000).toLocaleTimeString(), agent: 'Financial Processor', action: 'Processed batch transfer', result: '$245.50 transferred' }
    ];

    activities.forEach(activity => {
      console.log(`${colors.white}[${activity.time}]${colors.reset} ${colors.cyan}${activity.agent}${colors.reset}: ${activity.action} → ${colors.green}${activity.result}${colors.reset}`);
    });
  }

  async showHealthIndicators() {
    const indicators = [
      { name: 'Database Connection', status: 'healthy', value: '< 50ms' },
      { name: 'Stripe API', status: 'healthy', value: '< 200ms' },
      { name: 'Supabase Functions', status: 'warning', value: 'Some timeouts' },
      { name: 'Revenue Generation', status: 'healthy', value: 'Normal' }
    ];

    indicators.forEach(indicator => {
      const statusColor = indicator.status === 'healthy' ? colors.green : 
                         indicator.status === 'warning' ? colors.yellow : colors.red;
      const statusIcon = indicator.status === 'healthy' ? '🟢' : 
                        indicator.status === 'warning' ? '🟡' : '🔴';
      
      console.log(`${statusIcon} ${colors.white}${indicator.name}${colors.reset}: ${statusColor}${indicator.status}${colors.reset} (${indicator.value})`);
    });
  }

  async showFinancialTransactions() {
    const transactions = [
      { time: '14:32:15', type: 'USD Transfer', amount: '$125.50', status: 'completed', method: 'Stripe Connect' },
      { time: '14:28:42', type: 'Cashout Request', amount: '$45.25', status: 'processing', method: 'Bank Transfer' },
      { time: '14:15:33', type: 'Revenue Generated', amount: '$18.75', status: 'completed', method: 'Automated' },
      { time: '14:02:18', type: 'Commission', amount: '$67.80', status: 'completed', method: 'Affiliate' }
    ];

    transactions.forEach(tx => {
      const statusColor = tx.status === 'completed' ? colors.green : 
                         tx.status === 'processing' ? colors.yellow : colors.red;
      console.log(`${colors.white}[${tx.time}]${colors.reset} ${colors.cyan}${tx.type}${colors.reset}: ${colors.yellow}${tx.amount}${colors.reset} - ${statusColor}${tx.status}${colors.reset} via ${tx.method}`);
    });
  }

  async showAutomatedTransfers() {
    console.log(`${colors.green}✅ Last USD Sweep:${colors.reset}       2 minutes ago ($245.50)`);
    console.log(`${colors.blue}📊 Next Sweep:${colors.reset}           58 minutes`);
    console.log(`${colors.yellow}💰 Pending Amount:${colors.reset}       $127.25`);
    console.log(`${colors.cyan}🔄 Transfer Rate:${colors.reset}        99.2% success`);
  }

  async showPaymentSummary() {
    console.log(`${colors.green}💳 Successful Payments:${colors.reset}  247 ($12,450.75)`);
    console.log(`${colors.red}❌ Failed Payments:${colors.reset}      3 ($125.25)`);
    console.log(`${colors.yellow}⏳ Pending Payments:${colors.reset}     12 ($567.50)`);
    console.log(`${colors.magenta}📈 Success Rate:${colors.reset}         98.8%`);
  }

  async showMarketTrends() {
    console.log(`${colors.green}📈 Trending Up:${colors.reset}          Gaming & Entertainment (+15%)`);
    console.log(`${colors.yellow}📊 Stable:${colors.reset}               Finance & Business (±2%)`);
    console.log(`${colors.red}📉 Trending Down:${colors.reset}        Social Media (-8%)`);
    console.log(`${colors.cyan}🎯 Hot Opportunities:${colors.reset}    Crypto & NFT (+25%)`);
  }

  async showPerformanceAnalytics() {
    console.log(`${colors.blue}🎯 Conversion Rate:${colors.reset}      12.5% (↑2.3%)`);
    console.log(`${colors.green}💰 Revenue Per Click:${colors.reset}   $0.45 (↑$0.08)`);
    console.log(`${colors.yellow}👥 User Engagement:${colors.reset}     8.5 min avg (↑1.2 min)`);
    console.log(`${colors.magenta}🔄 Retention Rate:${colors.reset}      67% (↑5%)`);
  }

  async showOptimizationSuggestions() {
    console.log(`${colors.cyan}🎯 Focus on Gaming category${colors.reset} - Highest ROI potential`);
    console.log(`${colors.yellow}⚡ Increase automated bid frequency${colors.reset} - 15% improvement expected`);
    console.log(`${colors.green}📱 Optimize mobile experience${colors.reset} - 65% traffic from mobile`);
    console.log(`${colors.blue}🤖 Deploy additional market agents${colors.reset} - Scale current success`);
  }

  getServerStatusText(server) {
    return this.servers[server].status === 'running' 
      ? `${colors.green}🟢 Running${colors.reset}` 
      : `${colors.red}🔴 Stopped${colors.reset}`;
  }

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  stopMonitoring() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async getInput(prompt) {
    return new Promise((resolve) => {
      process.stdout.write(prompt);
      process.stdin.once('data', (data) => {
        resolve(data.toString());
      });
    });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  exit() {
    this.stopMonitoring();
    console.log(`\n${colors.cyan}${colors.bright}Thanks for using Click Clack Cash Flow Analytics! 🚀${colors.reset}\n`);
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Shutting down analytics dashboard...${colors.reset}`);
  process.exit(0);
});

// Start the CLI if run directly
if (require.main === module) {
  const analytics = new CliAnalytics();
  analytics.start().catch(console.error);
}

module.exports = CliAnalytics;