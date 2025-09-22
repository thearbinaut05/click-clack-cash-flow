#!/usr/bin/env node

/**
 * Auto-Start Server Manager
 * Automatically starts and manages both frontend and cashout servers
 * with process monitoring, auto-restart, and health checks
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

class AutoServerManager {
  constructor() {
    this.processes = {
      frontend: null,
      cashout: null
    };
    this.isShuttingDown = false;
    this.healthCheckInterval = null;
    this.restartCooldown = {
      frontend: 0,
      cashout: 0
    };
    this.RESTART_DELAY = 5000; // 5 seconds cooldown
    this.HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const colorCode = {
      'INFO': '\x1b[36m',    // Cyan
      'SUCCESS': '\x1b[32m', // Green
      'ERROR': '\x1b[31m',   // Red
      'WARNING': '\x1b[33m', // Yellow
      'RESET': '\x1b[0m'     // Reset
    };
    
    console.log(`${colorCode[type]}[${timestamp}] [${type}] ${message}${colorCode.RESET}`);
  }

  async checkServerHealth(port, name) {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      
      req.on('error', () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async buildProject() {
    this.log('Building project...');
    return new Promise((resolve, reject) => {
      exec('npm run build', (error, stdout, stderr) => {
        if (error) {
          this.log(`Build failed: ${error.message}`, 'ERROR');
          reject(error);
        } else {
          this.log('Project built successfully', 'SUCCESS');
          resolve();
        }
      });
    });
  }

  startFrontendServer() {
    if (this.processes.frontend) {
      this.log('Frontend server is already running', 'WARNING');
      return;
    }

    this.log('Starting frontend server on port 8080...');
    
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output.includes('Local:') || output.includes('localhost')) {
        this.log('Frontend server ready on http://localhost:8080', 'SUCCESS');
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (!error.includes('update-browserslist-db')) { // Ignore browserslist warnings
        this.log(`Frontend server error: ${error}`, 'ERROR');
      }
    });

    frontendProcess.on('close', (code) => {
      this.log(`Frontend server exited with code ${code}`, code === 0 ? 'INFO' : 'ERROR');
      this.processes.frontend = null;
      
      if (!this.isShuttingDown && code !== 0) {
        this.scheduleRestart('frontend');
      }
    });

    this.processes.frontend = frontendProcess;
  }

  startCashoutServer() {
    if (this.processes.cashout) {
      this.log('Cashout server is already running', 'WARNING');
      return;
    }

    this.log('Starting cashout server on port 4000...');
    
    const cashoutProcess = spawn('node', ['cashout-server.js'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    cashoutProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output.includes('running on port') || output.includes('4000')) {
        this.log('Cashout server ready on http://localhost:4000', 'SUCCESS');
      }
    });

    cashoutProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      this.log(`Cashout server error: ${error}`, 'ERROR');
    });

    cashoutProcess.on('close', (code) => {
      this.log(`Cashout server exited with code ${code}`, code === 0 ? 'INFO' : 'ERROR');
      this.processes.cashout = null;
      
      if (!this.isShuttingDown && code !== 0) {
        this.scheduleRestart('cashout');
      }
    });

    this.processes.cashout = cashoutProcess;
  }

  scheduleRestart(serverType) {
    const now = Date.now();
    if (now - this.restartCooldown[serverType] < this.RESTART_DELAY) {
      this.log(`${serverType} server restart skipped (cooldown active)`, 'WARNING');
      return;
    }

    this.restartCooldown[serverType] = now;
    this.log(`Scheduling ${serverType} server restart in ${this.RESTART_DELAY/1000} seconds...`, 'WARNING');

    setTimeout(() => {
      if (!this.isShuttingDown) {
        this.log(`Restarting ${serverType} server...`, 'INFO');
        if (serverType === 'frontend') {
          this.startFrontendServer();
        } else {
          this.startCashoutServer();
        }
      }
    }, this.RESTART_DELAY);
  }

  async startHealthChecks() {
    this.log('Starting health check monitoring...', 'INFO');
    
    this.healthCheckInterval = setInterval(async () => {
      if (this.isShuttingDown) return;

      // Check frontend health
      const frontendHealthy = await this.checkServerHealth(8080, 'frontend');
      if (!frontendHealthy && this.processes.frontend) {
        this.log('Frontend server health check failed', 'WARNING');
      }

      // Check cashout health
      const cashoutHealthy = await this.checkServerHealth(4000, 'cashout');
      if (!cashoutHealthy && this.processes.cashout) {
        this.log('Cashout server health check failed', 'WARNING');
      }

      // Log status every 5 minutes
      if (Date.now() % 300000 < this.HEALTH_CHECK_INTERVAL) {
        this.log(`Server Status - Frontend: ${frontendHealthy ? 'Healthy' : 'Down'}, Cashout: ${cashoutHealthy ? 'Healthy' : 'Down'}`, 'INFO');
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  async start() {
    this.log('🚀 Starting Click Clack Cash Flow Auto-Server Manager...', 'SUCCESS');
    this.log('🎯 This will automatically manage both frontend and cashout servers', 'INFO');

    // Setup graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());

    try {
      // Build the project
      await this.buildProject();

      // Start both servers
      this.startFrontendServer();
      this.startCashoutServer();

      // Wait a moment for servers to start
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Start health monitoring
      await this.startHealthChecks();

      this.log('✅ Auto-Server Manager is now running!', 'SUCCESS');
      this.log('🌐 Frontend: http://localhost:8080', 'INFO');
      this.log('💰 Cashout Server: http://localhost:4000', 'INFO');
      this.log('📊 Analytics: npm run analytics:enhanced', 'INFO');
      this.log('🛑 To stop: Ctrl+C', 'INFO');

    } catch (error) {
      this.log(`Failed to start servers: ${error.message}`, 'ERROR');
      process.exit(1);
    }
  }

  shutdown() {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    this.log('🛑 Shutting down Auto-Server Manager...', 'WARNING');

    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Kill processes
    Object.entries(this.processes).forEach(([name, process]) => {
      if (process) {
        this.log(`Stopping ${name} server...`, 'WARNING');
        process.kill('SIGTERM');
      }
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      this.log('Force shutting down...', 'ERROR');
      process.exit(0);
    }, 10000);

    // Graceful exit after 2 seconds
    setTimeout(() => {
      this.log('✅ Auto-Server Manager stopped', 'SUCCESS');
      process.exit(0);
    }, 2000);
  }
}

// Start the auto-server manager
if (require.main === module) {
  const manager = new AutoServerManager();
  manager.start().catch(error => {
    console.error('Failed to start Auto-Server Manager:', error);
    process.exit(1);
  });
}

module.exports = AutoServerManager;