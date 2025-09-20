# Click Clack Cash Flow - Production Deployment Guide

A production-ready click-based game with real cash payout functionality using Stripe Connect and PostgreSQL. This system processes real money transactions with PCI compliance, automated payouts, and comprehensive monitoring.

## 🚀 Production Features

- **PCI-Compliant Payment Processing**: Only accepts Stripe PaymentMethod IDs, never raw card data
- **Automated Payouts**: Scheduled via node-cron with retry logic and error handling
- **PostgreSQL Database**: Open-source database with connection pooling and transactions
- **Real-time Monitoring**: Comprehensive logging, health checks, and alerting
- **Security-First**: Rate limiting, CORS, Helmet security headers, and input validation
- **Scalable Architecture**: Production-ready backend with database migration support

## 📋 System Requirements

### Server Requirements
- **Node.js**: v16.0+ (LTS recommended)
- **PostgreSQL**: v12.0+ 
- **Memory**: Minimum 2GB RAM, 4GB+ recommended
- **Storage**: 20GB+ available space for logs and database
- **SSL Certificate**: Required for HTTPS (Let's Encrypt recommended)

### External Services
- **Stripe Account**: Live Stripe account with Connect enabled
- **Connected Account**: Configured Stripe Connect account for payouts
- **Domain**: Production domain with SSL certificate
- **Email Service**: For notifications (SendGrid, Mailgun, etc.)

## 🛠️ Installation & Setup

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Database Setup

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE click_clack_cashflow;
CREATE USER ccf_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE click_clack_cashflow TO ccf_user;
ALTER USER ccf_user CREATEDB;
\q
EOF

# Configure PostgreSQL for production
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: max_connections = 100, shared_buffers = 256MB, effective_cache_size = 1GB

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 3. Application Deployment

```bash
# Clone repository
git clone https://github.com/thearbinaut05/click-clack-cash-flow.git
cd click-clack-cash-flow

# Install dependencies
npm install --production

# Create production environment file
cp .env.example .env
nano .env  # Configure production values (see Environment Configuration below)

# Run database migration
node -e "import('./db.js').then(db => db.default.migrate())"

# Build frontend
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 4. Nginx Configuration

```nginx
# /etc/nginx/sites-available/click-clack-cashflow
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend (static files)
    location / {
        root /path/to/click-clack-cash-flow/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Legacy cashout endpoint
    location /cashout {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:4000;
        access_log off;
    }
}
```

### 5. SSL Certificate

```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

## 🔧 Environment Configuration

### Production .env File

```bash
# STRIPE CONFIGURATION (REQUIRED)
STRIPE_SECRET_KEY_LIVE=sk_live_your_live_stripe_secret_key
CONNECTED_ACCOUNT_ID=acct_your_connected_account_id
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# DATABASE CONFIGURATION (REQUIRED)
DATABASE_URL=postgresql://ccf_user:your_secure_password@localhost:5432/click_clack_cashflow

# SERVER CONFIGURATION
NODE_ENV=production
PORT=4000
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# PAYOUT AUTOMATION
PAYOUT_CRON_SCHEDULE=0 */6 * * *
MIN_PAYOUT_AMOUNT=500
MAX_PAYOUT_AMOUNT=100000
MAX_RETRY_ATTEMPTS=3

# SECURITY
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
FORCE_HTTPS=true
SECURITY_HEADERS_ENABLED=true

# MONITORING
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
PAYOUT_WEBHOOK_URL=https://yourdomain.com/api/webhooks/payout-status

# EMAIL NOTIFICATIONS
EMAIL_SERVICE_API_KEY=your-email-service-api-key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# GAME CONFIGURATION
COINS_TO_USD_RATE=100
MIN_PAYOUT_AMOUNT=500
ENERGY_MAX_DEFAULT=100
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints

- `GET /health` - Application health status
- `GET /metrics` - Prometheus metrics (if enabled)
- `GET /api/health` - Detailed system health check

### Log Files

```bash
# View logs
pm2 logs click-clack-cashflow

# Application logs
tail -f logs/combined.log
tail -f logs/payouts.log
tail -f logs/error.log

# Payout job logs
tail -f logs/payout-combined.log
```

### Setting Up Monitoring

1. **Prometheus + Grafana** (recommended for self-hosted)
2. **DataDog/New Relic** (for managed monitoring)
3. **Sentry** (for error tracking)
4. **LogDNA/Loggly** (for log aggregation)

See `monitoring.md` for detailed setup instructions.

## 🔄 Automated Payouts

### Cron Job Configuration

The payout job runs automatically based on the `PAYOUT_CRON_SCHEDULE` environment variable:

```bash
# Check payout job status
node payout-job.js --check-health

# Run payout job manually
node payout-job.js

# Start payout daemon
node payout-job.js --daemon
```

### PM2 Ecosystem Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'click-clack-cashflow',
      script: 'cashout-server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true
    },
    {
      name: 'payout-job',
      script: 'payout-job.js',
      args: '--daemon',
      instances: 1,
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

## 🔒 Security Considerations

### PCI Compliance
- ✅ Never collect or store raw card data
- ✅ Only use Stripe PaymentMethod IDs
- ✅ All communications over HTTPS
- ✅ Input validation and sanitization
- ✅ Rate limiting on all endpoints

### Security Headers
```javascript
// Automatically configured via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com"]
    }
  }
}));
```

### Database Security
- Use connection pooling with limits
- Enable row-level security (RLS)
- Regular security updates
- Encrypted backups

## 🚀 API Documentation

### PCI-Compliant Endpoints

#### POST /api/payment-methods
Store and validate Stripe PaymentMethod IDs.

```javascript
// Request
{
  "paymentMethodId": "pm_1234567890abcdef",
  "userId": "user_123",
  "email": "user@example.com"
}

// Response
{
  "success": true,
  "paymentMethod": {
    "id": "pm_1234567890abcdef",
    "type": "card",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2025
    }
  }
}
```

#### POST /api/cashout
Process cashout using PaymentMethod ID.

```javascript
// Request
{
  "userId": "user_123",
  "coins": 1000,
  "paymentMethodId": "pm_1234567890abcdef",
  "email": "user@example.com"
}

// Response
{
  "success": true,
  "userId": "user_123",
  "amountUSD": 10.00,
  "payoutMethod": "payment_method_id",
  "details": {
    "transferId": "tr_1234567890abcdef",
    "type": "card_transfer"
  }
}
```

#### POST /api/create-checkout-session
Create Stripe Checkout session for payment method setup.

```javascript
// Request
{
  "userId": "user_123",
  "email": "user@example.com",
  "amount": 1000,
  "successUrl": "https://yourdomain.com/success",
  "cancelUrl": "https://yourdomain.com/cancel"
}

// Response
{
  "success": true,
  "sessionId": "cs_test_1234567890abcdef",
  "url": "https://checkout.stripe.com/pay/cs_test_1234567890abcdef"
}
```

## 🔄 Database Migration

### From Supabase to PostgreSQL

1. **Export Supabase Data**:
   ```bash
   # Use Supabase CLI or dashboard export
   supabase db dump --file supabase_backup.sql
   ```

2. **Run Migration**:
   ```bash
   # Apply migration schema
   psql -d click_clack_cashflow -f migration.sql
   
   # Import existing data (if any)
   psql -d click_clack_cashflow -f supabase_backup.sql
   ```

3. **Verify Migration**:
   ```bash
   node -e "import('./db.js').then(db => db.default.healthCheck().then(console.log))"
   ```

## 📈 Performance Optimization

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_payout_requests_status_created 
ON payout_requests(status, created_at);

CREATE INDEX CONCURRENTLY idx_transactions_user_created 
ON transactions(user_id, created_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM payout_requests WHERE status = 'pending';
```

### Application Optimization
- Use PM2 cluster mode for load balancing
- Enable gzip compression in Nginx
- Implement Redis caching for sessions
- Use CDN for static assets

## 🆘 Troubleshooting

### Common Issues

1. **PaymentMethod not found**
   - Verify PaymentMethod was created in the correct Stripe account
   - Check if using test vs live keys consistently

2. **Database connection errors**
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check connection string format
   - Ensure user has proper permissions

3. **SSL/Certificate issues**
   - Renew certificate: `sudo certbot renew`
   - Check certificate validity: `openssl x509 -in cert.pem -text -noout`

4. **High memory usage**
   - Check for memory leaks: `node --inspect`
   - Monitor database connection pool
   - Review log file sizes

### Emergency Procedures

1. **Service Down**
   ```bash
   # Check service status
   pm2 status
   
   # Restart services
   pm2 restart all
   
   # Check logs
   pm2 logs --lines 50
   ```

2. **Database Issues**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Restart PostgreSQL
   sudo systemctl restart postgresql
   
   # Check database connections
   sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
   ```

## 📞 Support & Maintenance

### Regular Maintenance Tasks

1. **Daily**
   - Monitor error logs
   - Check payout job execution
   - Verify SSL certificate status

2. **Weekly**
   - Review performance metrics
   - Update dependencies (security patches)
   - Backup database

3. **Monthly**
   - Full system security audit
   - Performance optimization review
   - Disaster recovery testing

### Production Checklist

- [ ] SSL certificate configured and auto-renewing
- [ ] Database backups automated
- [ ] Monitoring and alerting active
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] Log rotation set up
- [ ] PM2 process management configured
- [ ] Nginx reverse proxy configured
- [ ] Stripe webhooks configured
- [ ] Error tracking (Sentry) active
- [ ] Performance monitoring active

### Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [PostgreSQL Production Guide](https://www.postgresql.org/docs/current/admin.html)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Nginx Security Guide](https://nginx.org/en/docs/http/securing_http.html)

---

**Important**: This is a production system handling real money. Always test thoroughly in a staging environment before deploying to production. Ensure compliance with all applicable financial regulations in your jurisdiction.

