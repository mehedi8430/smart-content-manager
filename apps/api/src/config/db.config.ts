import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';
// Add explicit sslmode=verify-full to avoid deprecation warning
// Replace deprecated SSL modes (require, prefer, verify-ca) with verify-full
const connectionStringWithSSL = (() => {
  if (!connectionString) return connectionString;
  
  // Check for deprecated SSL modes and replace them
  if (/[?&]sslmode=(require|prefer|verify-ca)(?:[&#]|$)/.test(connectionString)) {
    return connectionString.replace(/sslmode=(require|prefer|verify-ca)/, 'sslmode=verify-full');
  }
  
  // If no sslmode parameter exists, add verify-full
  if (!connectionString.includes('sslmode')) {
    return `${connectionString}${connectionString.includes('?') ? '&' : '?'}sslmode=verify-full`;
  }
  
  return connectionString;
})();

// Connection pool config: tuned for Neon serverless PostgreSQL.
// - max: 5 prevents exhausting Neon's connection limit on free tier
// - idleTimeoutMillis: closes idle connections after 30s to free resources
// - connectionTimeoutMillis: fails fast (10s) instead of hanging on cold starts
const pool = new Pool({
  connectionString: connectionStringWithSSL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Prevent unhandled pool errors from crashing the server
pool.on('error', (err) => {
  console.error('Unexpected pool error:', err.message);
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("DB connected via Prisma");
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Database connection error: ${message}`);
        process.exit(1);
    }
}

const disconnectDB = async () => {
    await prisma.$disconnect();
}

export { prisma, connectDB, disconnectDB };