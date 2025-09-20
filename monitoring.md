# Production Monitoring & Logging Guide

This guide provides comprehensive instructions for setting up production monitoring, logging, and alerting for the Click Clack Cash Flow application.

## 📊 Monitoring Overview

### Key Metrics to Monitor

#### Application Metrics
- **Payout Success Rate**: Percentage of successful payouts vs failed
- **Average Payout Processing Time**: Time from request to completion
- **Active Users**: Daily/weekly active users and their engagement
- **Revenue Metrics**: Total revenue, average payout amount, conversion rates
- **Error Rates**: 4xx and 5xx error rates across all endpoints

#### System Metrics
- **CPU Usage**: Server CPU utilization
- **Memory Usage**: RAM consumption and memory leaks
- **Disk Space**: Available storage and log file sizes
- **Database Performance**: Query execution time, connection pool usage
- **Network**: Response times, throughput, and connection errors

#### Security Metrics
- **Failed Authentication Attempts**: Potential security threats
- **Rate Limit Violations**: API abuse attempts
- **SSL Certificate Expiry**: Certificate validity monitoring
- **Webhook Failures**: Stripe webhook delivery issues

## 🔧 Log Configuration

### 1. Winston Logger Setup (Already Implemented)

The application uses Winston for structured logging. Here's the production configuration:

```javascript
// logger-config.js
import winston from 'winston';
import path from 'path';

const logDir = process.env.LOG_DIR || './logs';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'click-clack-cashflow',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Combined logs
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    }),
    
    // Payout-specific logs
    new winston.transports.File({ 
      filename: path.join(logDir, 'payouts.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf(info => {
          // Only log payout-related messages
          if (info.message.includes('payout') || info.service === 'payout-job') {
            return JSON.stringify(info);
          }
          return '';
        })
      )
    }),
    
    // Console output (disable in production)
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ] : [])
  ]
});

// Handle uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
);

// Handle unhandled promise rejections
logger.rejections.handle(
  new winston.transports.File({ filename: path.join(logDir, 'rejections.log') })
);
```

### 2. Log Rotation Setup

Use `logrotate` to manage log file sizes and retention:

```bash
# /etc/logrotate.d/click-clack-cashflow
/path/to/your/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 app app
    sharedscripts
    postrotate
        # Restart your application to reopen log files
        systemctl reload click-clack-cashflow
    endscript
}
```

### 3. Structured Logging Format

Use consistent log structure across all components:

```javascript
// Example log entries
logger.info('Payout processed', {
  payoutId: 'payout_123',
  userId: 'user_456',
  amount: 1000, // cents
  currency: 'usd',
  status: 'completed',
  processingTime: 2340, // milliseconds
  paymentMethodId: 'pm_abc123',
  stripePayoutId: 'po_stripe123'
});

logger.error('Payout failed', {
  payoutId: 'payout_123',
  userId: 'user_456',
  amount: 1000,
  error: 'insufficient_funds',
  errorMessage: 'Insufficient funds in connected account',
  retryCount: 2,
  nextRetryAt: '2024-01-15T10:30:00Z'
});
```

## 📈 Monitoring Setup

### 1. Health Check Endpoints

Implement comprehensive health checks:

```javascript
// health-check.js
import db from './db.js';
import { logger } from './logger-config.js';

export async function healthCheck(req, res) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.APP_VERSION || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    checks: {}
  };

  try {
    // Database connectivity
    const dbHealth = await db.healthCheck();
    checks.checks.database = dbHealth;

    // Stripe connectivity
    const stripeHealth = await checkStripeConnection();
    checks.checks.stripe = stripeHealth;

    // Memory usage
    const memUsage = process.memoryUsage();
    checks.checks.memory = {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    };

    // Disk space
    checks.checks.disk = await checkDiskSpace();

    // Recent error rate
    checks.checks.errorRate = await getRecentErrorRate();

    // Overall status
    const hasUnhealthyChecks = Object.values(checks.checks)
      .some(check => check.status === 'unhealthy');
    
    if (hasUnhealthyChecks) {
      checks.status = 'degraded';
      res.status(503);
    }

  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    checks.status = 'unhealthy';
    checks.error = error.message;
    res.status(503);
  }

  res.json(checks);
}

async function checkStripeConnection() {
  try {
    const account = await stripe.accounts.retrieve(process.env.CONNECTED_ACCOUNT_ID);
    return {
      status: 'healthy',
      accountId: account.id,
      country: account.country,
      payoutsEnabled: account.payouts_enabled
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

async function checkDiskSpace() {
  const fs = await import('fs');
  const stats = fs.statSync('./');
  return {
    status: 'healthy',
    // Add disk space checking logic
  };
}

async function getRecentErrorRate() {
  // Calculate error rate from last 5 minutes of logs
  return {
    status: 'healthy',
    errorRate: '0.01%',
    timeWindow: '5m'
  };
}
```

### 2. Metrics Collection

Set up Prometheus metrics:

```javascript
// metrics.js
import express from 'express';
import client from 'prom-client';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({
  app: 'click-clack-cashflow',
  prefix: 'ccf_',
  timeout: 10000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  register
});

// Custom metrics
const payoutCounter = new client.Counter({
  name: 'ccf_payouts_total',
  help: 'Total number of payouts processed',
  labelNames: ['status', 'method'],
  register
});

const payoutDuration = new client.Histogram({
  name: 'ccf_payout_duration_seconds',
  help: 'Time taken to process payouts',
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  register
});

const activeUsers = new client.Gauge({
  name: 'ccf_active_users',
  help: 'Number of currently active users',
  register
});

const revenueGauge = new client.Gauge({
  name: 'ccf_revenue_total_usd',
  help: 'Total revenue in USD',
  register
});

// Metrics endpoint
export function metricsHandler(req, res) {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
}

// Metric helper functions
export function recordPayoutAttempt(status, method, duration) {
  payoutCounter.inc({ status, method });
  payoutDuration.observe(duration);
}

export function updateActiveUsers(count) {
  activeUsers.set(count);
}

export function updateRevenue(amount) {
  revenueGauge.set(amount);
}
```

### 3. Application Performance Monitoring (APM)

#### Sentry Integration

```javascript
// sentry-config.js
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new ProfilingIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // Profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Filter out sensitive data
    if (event.extra) {
      delete event.extra.paymentMethodId;
      delete event.extra.stripeKeys;
    }
    return event;
  }
});

// Express middleware
export const sentryRequestHandler = Sentry.Handlers.requestHandler();
export const sentryTracingHandler = Sentry.Handlers.tracingHandler();
export const sentryErrorHandler = Sentry.Handlers.errorHandler();
```

## 🚨 Alerting Setup

### 1. Alert Definitions

Create alert rules for critical issues:

```yaml
# alerts.yml (for Prometheus Alertmanager)
groups:
  - name: click-clack-cashflow
    rules:
      - alert: HighPayoutFailureRate
        expr: rate(ccf_payouts_total{status="failed"}[5m]) / rate(ccf_payouts_total[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High payout failure rate detected"
          description: "Payout failure rate is {{ $value }}% over the last 5 minutes"

      - alert: DatabaseConnectionDown
        expr: up{job="click-clack-cashflow-db"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection is down"

      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / process_virtual_memory_max_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"

      - alert: PayoutJobNotRunning
        expr: time() - ccf_last_payout_job_timestamp > 3600
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Payout job hasn't run in over an hour"
```

### 2. Webhook Notifications

Set up webhook alerts for immediate notification:

```javascript
// webhook-alerts.js
import fetch from 'node-fetch';

const WEBHOOK_ENDPOINTS = {
  slack: process.env.SLACK_WEBHOOK_URL,
  teams: process.env.TEAMS_WEBHOOK_URL,
  discord: process.env.DISCORD_WEBHOOK_URL,
  custom: process.env.ALERT_WEBHOOK_URL
};

export async function sendAlert(level, message, details = {}) {
  const alert = {
    timestamp: new Date().toISOString(),
    level, // 'info', 'warning', 'error', 'critical'
    service: 'click-clack-cashflow',
    message,
    details,
    environment: process.env.NODE_ENV
  };

  // Send to all configured endpoints
  const promises = Object.entries(WEBHOOK_ENDPOINTS)
    .filter(([_, url]) => url)
    .map(([platform, url]) => sendToWebhook(platform, url, alert));

  await Promise.allSettled(promises);
}

async function sendToWebhook(platform, url, alert) {
  try {
    let payload;
    
    switch (platform) {
      case 'slack':
        payload = formatSlackMessage(alert);
        break;
      case 'teams':
        payload = formatTeamsMessage(alert);
        break;
      case 'discord':
        payload = formatDiscordMessage(alert);
        break;
      default:
        payload = alert;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
  } catch (error) {
    logger.error('Failed to send webhook alert', { 
      platform, 
      error: error.message,
      alert: alert.message 
    });
  }
}

function formatSlackMessage(alert) {
  const color = {
    info: 'good',
    warning: 'warning', 
    error: 'danger',
    critical: 'danger'
  }[alert.level];

  return {
    attachments: [{
      color,
      title: `${alert.level.toUpperCase()}: ${alert.message}`,
      fields: [
        { title: 'Service', value: alert.service, short: true },
        { title: 'Environment', value: alert.environment, short: true },
        { title: 'Time', value: alert.timestamp, short: true },
        ...Object.entries(alert.details).map(([key, value]) => ({
          title: key,
          value: JSON.stringify(value),
          short: true
        }))
      ]
    }]
  };
}
```

## 📋 Monitoring Tools Recommendations

### 1. Self-Hosted Solutions

#### Grafana + Prometheus + Alertmanager
```yaml
# docker-compose.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alerts.yml:/etc/prometheus/alerts.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=your_password
    volumes:
      - grafana-storage:/var/lib/grafana

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml

volumes:
  grafana-storage:
```

#### ELK Stack (Elasticsearch + Logstash + Kibana)
```yaml
# For log aggregation and analysis
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
```

### 2. Cloud Solutions

#### DataDog
```javascript
// datadog-config.js
import { StatsD } from 'node-statsd';

const statsD = new StatsD({
  host: 'localhost',
  port: 8125,
  prefix: 'ccf.'
});

export function recordMetric(metric, value, tags = []) {
  statsD.gauge(metric, value, tags);
}
```

#### New Relic
```javascript
// newrelic-config.js
import newrelic from 'newrelic';

export function recordCustomEvent(eventType, attributes) {
  newrelic.recordCustomEvent(eventType, attributes);
}

export function addCustomAttribute(key, value) {
  newrelic.addCustomAttribute(key, value);
}
```

## 🔍 Log Analysis & Debugging

### 1. Log Parsing Commands

```bash
# Find all payout failures in the last 24 hours
grep -i "payout.*failed" /var/log/click-clack-cashflow/payouts.log | \
  grep "$(date -d '24 hours ago' '+%Y-%m-%d')"

# Count errors by type
grep -o '"error":"[^"]*"' /var/log/click-clack-cashflow/error.log | \
  sort | uniq -c | sort -nr

# Monitor real-time logs
tail -f /var/log/click-clack-cashflow/combined.log | jq .

# Find high-value failed payouts
grep "payout.*failed" /var/log/click-clack-cashflow/payouts.log | \
  jq 'select(.amount > 10000)' # More than $100
```

### 2. Automated Log Analysis

```bash
#!/bin/bash
# log-analyzer.sh - Daily log analysis script

LOG_DIR="/var/log/click-clack-cashflow"
DATE=$(date '+%Y-%m-%d')
REPORT_FILE="/tmp/daily-report-$DATE.txt"

echo "=== Daily Log Analysis Report - $DATE ===" > $REPORT_FILE

# Error count
ERROR_COUNT=$(grep -c "\"level\":\"error\"" $LOG_DIR/combined.log)
echo "Total Errors: $ERROR_COUNT" >> $REPORT_FILE

# Payout statistics
SUCCESSFUL_PAYOUTS=$(grep -c "payout.*completed" $LOG_DIR/payouts.log)
FAILED_PAYOUTS=$(grep -c "payout.*failed" $LOG_DIR/payouts.log)
echo "Successful Payouts: $SUCCESSFUL_PAYOUTS" >> $REPORT_FILE
echo "Failed Payouts: $FAILED_PAYOUTS" >> $REPORT_FILE

# Top errors
echo "=== Top Errors ===" >> $REPORT_FILE
grep '"level":"error"' $LOG_DIR/combined.log | \
  jq -r '.message' | sort | uniq -c | sort -nr | head -5 >> $REPORT_FILE

# Send report
mail -s "Daily Log Report - $DATE" admin@yourdomain.com < $REPORT_FILE
```

## 🔧 Production Deployment Checklist

### Monitoring Setup
- [ ] Winston logging configured with appropriate levels
- [ ] Log rotation set up with logrotate
- [ ] Health check endpoints implemented
- [ ] Prometheus metrics endpoint available
- [ ] Grafana dashboards created
- [ ] Alert rules configured
- [ ] Webhook notifications tested
- [ ] Error tracking (Sentry/Bugsnag) configured

### Infrastructure Monitoring
- [ ] Server resource monitoring (CPU, RAM, Disk)
- [ ] Database performance monitoring
- [ ] Network connectivity monitoring
- [ ] SSL certificate expiry monitoring
- [ ] Backup system monitoring

### Application Monitoring
- [ ] Payout success/failure rates
- [ ] API response times
- [ ] User activity metrics
- [ ] Revenue tracking
- [ ] Security event monitoring

### Alerting
- [ ] Critical alerts (service down, high error rate)
- [ ] Warning alerts (high resource usage, degraded performance)
- [ ] Business alerts (unusual payout patterns, revenue changes)
- [ ] Escalation procedures documented
- [ ] On-call rotation established

## 📞 Support & Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check for memory leaks in application code
   - Monitor database connection pool size
   - Review log file sizes and rotation

2. **Database Connection Errors**
   - Verify connection string and credentials
   - Check network connectivity
   - Monitor connection pool usage

3. **Stripe API Errors**
   - Verify API keys are correct and active
   - Check rate limiting
   - Monitor webhook endpoint health

4. **Log File Issues**
   - Ensure proper permissions on log directory
   - Check disk space availability
   - Verify log rotation is working

### Emergency Procedures

1. **Service Down**
   - Check application logs for errors
   - Verify database connectivity
   - Restart application services
   - Check load balancer health

2. **High Error Rate**
   - Review recent deployments
   - Check external service status
   - Scale resources if needed
   - Enable maintenance mode if critical

3. **Payment Processing Issues**
   - Verify Stripe dashboard for service status
   - Check connected account configuration
   - Review recent payout failures
   - Contact Stripe support if needed

Remember: Proactive monitoring prevents reactive firefighting. Set up comprehensive monitoring before issues occur!