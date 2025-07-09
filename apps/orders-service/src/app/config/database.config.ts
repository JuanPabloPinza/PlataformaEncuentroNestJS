import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';

export interface DatabaseConfig {
  type: 'postgres' | 'cockroachdb';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
  connectionLimit?: number;
  maxQueryExecutionTime?: number;
}

export function createDatabaseConfig(): TypeOrmModuleOptions {
  // Environment variables with fallbacks
  const dbType = process.env.DB_TYPE || 'postgres';
  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbPort = parseInt(process.env.DB_PORT || '5432');
  const dbUsername = process.env.DB_USERNAME || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'password';
  const dbName = process.env.DB_NAME || 'orders_db';
  const dbSsl = process.env.DB_SSL === 'true';
  const connectionLimit = parseInt(process.env.DB_CONNECTION_LIMIT || '20');
  const maxQueryExecutionTime = parseInt(process.env.DB_MAX_QUERY_EXECUTION_TIME || '60000');

  console.log(`🗄️ Configuring database connection:`);
  console.log(`   Type: ${dbType}`);
  console.log(`   Host: ${dbHost}:${dbPort}`);
  console.log(`   Database: ${dbName}`);
  console.log(`   User: ${dbUsername}`);
  console.log(`   SSL: ${dbSsl}`);

  const baseConfig: TypeOrmModuleOptions = {
    type: 'postgres', // CockroachDB uses postgres driver
    host: dbHost,
    port: dbPort,
    username: dbUsername,
    password: dbPassword,
    database: dbName,
    entities: [Order],
    synchronize: true, // Set to false in production
    logging: process.env.NODE_ENV === 'development',
    maxQueryExecutionTime,
    extra: {
      max: connectionLimit,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      statement_timeout: maxQueryExecutionTime,
    },
  };

  // CockroachDB specific configurations
  if (dbType === 'cockroachdb') {
    console.log(`🪳 Using CockroachDB optimizations`);
    return {
      ...baseConfig,
      ssl: dbSsl,
      extra: {
        ...baseConfig.extra,
        // CockroachDB specific connection options
        application_name: 'orders-service',
        // Retry logic for CockroachDB transactions
        retryWrites: true,
        // Connection pool settings optimized for CockroachDB
        max: connectionLimit,
        min: 2,
        acquire: 30000,
        idle: 10000,
        evict: 60000,
        // CockroachDB specific timeouts
        statement_timeout: maxQueryExecutionTime,
        lock_timeout: 10000,
      },
    };
  }

  // Standard PostgreSQL configuration
  console.log(`🐘 Using PostgreSQL configuration`);
  return baseConfig;
}
