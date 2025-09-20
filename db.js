/**
 * PostgreSQL Database Wrapper for Click Clack Cash Flow
 * 
 * This module provides a production-ready PostgreSQL wrapper for the Node.js backend,
 * replacing Supabase with open-source PostgreSQL. Includes connection pooling,
 * error handling, transaction management, and migration support.
 * 
 * Features:
 * - Connection pooling with automatic reconnection
 * - Transaction management with rollback support
 * - SQL injection protection with parameterized queries
 * - Comprehensive error handling and logging
 * - Database schema validation
 * - Performance monitoring and metrics
 * - Production-ready configuration
 * 
 * Environment Variables:
 *   DATABASE_URL              - PostgreSQL connection string
 *   DB_POOL_MIN              - Minimum pool connections (default: 2)
 *   DB_POOL_MAX              - Maximum pool connections (default: 10)
 *   DB_POOL_IDLE_TIMEOUT     - Idle timeout in ms (default: 30000)
 *   DB_CONNECTION_TIMEOUT    - Connection timeout in ms (default: 10000)
 *   DB_STATEMENT_TIMEOUT     - Statement timeout in ms (default: 30000)
 */

import { Pool } from 'pg';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  connectionString: process.env.DATABASE_URL,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
  statementTimeoutMillis: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Validate required configuration
if (!CONFIG.connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Setup logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'database' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Create connection pool
const pool = new Pool(CONFIG);

// Pool event handlers
pool.on('connect', (client) => {
  logger.debug('New database client connected', { 
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

pool.on('error', (err, client) => {
  logger.error('Database pool error', { error: err.message });
});

pool.on('remove', (client) => {
  logger.debug('Database client removed from pool');
});

// Database metrics
let dbMetrics = {
  totalQueries: 0,
  successfulQueries: 0,
  failedQueries: 0,
  totalQueryTime: 0,
  connections: {
    total: 0,
    idle: 0,
    waiting: 0
  }
};

/**
 * Database connection class with transaction support
 */
class DatabaseConnection {
  constructor(client, release) {
    this.client = client;
    this.release = release;
    this.inTransaction = false;
  }

  /**
   * Execute a query with parameterized values
   */
  async query(text, params = []) {
    const startTime = Date.now();
    dbMetrics.totalQueries++;
    
    try {
      logger.debug('Executing query', { 
        sql: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        params: params?.length || 0 
      });
      
      const result = await this.client.query(text, params);
      
      const duration = Date.now() - startTime;
      dbMetrics.successfulQueries++;
      dbMetrics.totalQueryTime += duration;
      
      logger.debug('Query completed', { 
        rows: result.rows?.length || 0,
        duration: `${duration}ms` 
      });
      
      return result;
    } catch (error) {
      dbMetrics.failedQueries++;
      logger.error('Query failed', { 
        error: error.message,
        sql: text.substring(0, 100),
        params: params?.length || 0
      });
      throw error;
    }
  }

  /**
   * Begin a transaction
   */
  async begin() {
    if (this.inTransaction) {
      throw new Error('Transaction already in progress');
    }
    
    await this.query('BEGIN');
    this.inTransaction = true;
    logger.debug('Transaction started');
  }

  /**
   * Commit a transaction
   */
  async commit() {
    if (!this.inTransaction) {
      throw new Error('No transaction in progress');
    }
    
    await this.query('COMMIT');
    this.inTransaction = false;
    logger.debug('Transaction committed');
  }

  /**
   * Rollback a transaction
   */
  async rollback() {
    if (!this.inTransaction) {
      throw new Error('No transaction in progress');
    }
    
    await this.query('ROLLBACK');
    this.inTransaction = false;
    logger.debug('Transaction rolled back');
  }

  /**
   * Release the connection back to the pool
   */
  async close() {
    if (this.inTransaction) {
      logger.warn('Releasing connection with active transaction, rolling back');
      await this.rollback();
    }
    this.release();
  }
}

/**
 * Database class with high-level operations
 */
class Database {
  constructor() {
    this.pool = pool;
  }

  /**
   * Get a connection from the pool
   */
  async getConnection() {
    try {
      const client = await this.pool.connect();
      
      // Update metrics
      dbMetrics.connections.total = this.pool.totalCount;
      dbMetrics.connections.idle = this.pool.idleCount;
      dbMetrics.connections.waiting = this.pool.waitingCount;
      
      return new DatabaseConnection(client, () => client.release());
    } catch (error) {
      logger.error('Failed to get database connection', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute a single query (auto-releases connection)
   */
  async query(text, params = []) {
    const connection = await this.getConnection();
    try {
      return await connection.query(text, params);
    } finally {
      await connection.close();
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(callback) {
    const connection = await this.getConnection();
    try {
      await connection.begin();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.close();
    }
  }

  /**
   * Check database connection health
   */
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as health, NOW() as timestamp');
      return {
        status: 'healthy',
        timestamp: result.rows[0].timestamp,
        pool: {
          total: this.pool.totalCount,
          idle: this.pool.idleCount,
          waiting: this.pool.waitingCount
        },
        metrics: {
          totalQueries: dbMetrics.totalQueries,
          successRate: dbMetrics.totalQueries > 0 
            ? ((dbMetrics.successfulQueries / dbMetrics.totalQueries) * 100).toFixed(2) + '%'
            : 'N/A',
          avgQueryTime: dbMetrics.totalQueries > 0 
            ? (dbMetrics.totalQueryTime / dbMetrics.totalQueries).toFixed(2) + 'ms'
            : 'N/A'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Run database migrations
   */
  async migrate() {
    logger.info('Starting database migration');
    
    const migrationFile = path.join(__dirname, 'migration.sql');
    if (!fs.existsSync(migrationFile)) {
      logger.warn('No migration.sql file found, skipping migration');
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    const connection = await this.getConnection();
    
    try {
      await connection.begin();
      
      // Split migration into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        logger.debug('Executing migration statement', { 
          statement: statement.substring(0, 100) + '...' 
        });
        await connection.query(statement);
      }
      
      await connection.commit();
      logger.info('Database migration completed successfully');
    } catch (error) {
      await connection.rollback();
      logger.error('Database migration failed', { error: error.message });
      throw error;
    } finally {
      await connection.close();
    }
  }

  /**
   * Close all connections
   */
  async close() {
    logger.info('Closing database pool');
    await this.pool.end();
  }
}

/**
 * Predefined queries for common operations
 */
const queries = {
  // User operations
  users: {
    findById: 'SELECT * FROM users WHERE id = $1',
    findByEmail: 'SELECT * FROM users WHERE email = $1',
    create: `
      INSERT INTO users (id, email, created_at, updated_at) 
      VALUES ($1, $2, NOW(), NOW()) 
      RETURNING *
    `,
    updateCoins: `
      UPDATE users 
      SET coins = $2, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `
  },

  // Payout operations
  payouts: {
    findPending: `
      SELECT * FROM payout_requests 
      WHERE status = 'pending' 
        AND amount_cents >= $1 
        AND retry_count < $2 
      ORDER BY created_at ASC 
      LIMIT $3
    `,
    create: `
      INSERT INTO payout_requests (
        user_id, payment_method_id, amount_cents, currency, 
        metadata, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW()) 
      RETURNING *
    `,
    updateStatus: `
      UPDATE payout_requests 
      SET status = $1, stripe_payout_id = $2, error_message = $3, 
          processed_at = NOW(), retry_count = retry_count + 1
      WHERE id = $4
    `
  },

  // Transaction operations
  transactions: {
    create: `
      INSERT INTO transactions (
        user_id, type, amount_cents, description, 
        metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW()) 
      RETURNING *
    `,
    findByUser: `
      SELECT * FROM transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `
  },

  // Game state operations
  gameState: {
    findByUser: 'SELECT * FROM game_states WHERE user_id = $1',
    upsert: `
      INSERT INTO game_states (
        user_id, coins, level, energy, multiplier, 
        last_updated, data
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        coins = EXCLUDED.coins,
        level = EXCLUDED.level,
        energy = EXCLUDED.energy,
        multiplier = EXCLUDED.multiplier,
        last_updated = NOW(),
        data = EXCLUDED.data
      RETURNING *
    `
  }
};

// Create database instance
const db = new Database();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing database connections');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connections');
  await db.close();
  process.exit(0);
});

export default db;
export { Database, queries, dbMetrics };