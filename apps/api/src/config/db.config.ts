import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';
// Normalize sslmode to 'require' for pooled Neon connections.
// NOTE: we intentionally do NOT use 'verify-full' here. It forces validation
// of the server cert against a trusted CA chain, and Node's pg driver doesn't
// bundle CA certs by default - that can throw intermittent
// "self-signed certificate in certificate chain" errors that look like
// cold-start flakiness. Neon's own docs recommend 'require' for pooled
// connections, so we standardize on that instead of chasing the deprecation
// warning by switching to the stricter mode.
const connectionStringWithSSL = (() => {
  if (!connectionString) return connectionString;

  // Replace any existing sslmode value with 'require'
  if (/[?&]sslmode=[^&#]*/.test(connectionString)) {
    return connectionString.replace(/sslmode=[^&#]*/, 'sslmode=require');
  }

  // If no sslmode parameter exists, add it
  return `${connectionString}${connectionString.includes('?') ? '&' : '?'}sslmode=require`;
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