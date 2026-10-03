import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';

export const normalizeDatabaseUrl = (url: string): string => {
  if (!url) return url;

  if (/[?&]sslmode=/i.test(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    const isLocalHost = ['localhost', '127.0.0.1', 'db', 'postgres', '::1'].includes(host)
      || host.endsWith('.local')
      || host.endsWith('.internal');

    if (isLocalHost) {
      return url;
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}sslmode=require`;
  } catch {
    return url;
  }
};

// Preserve explicit sslmode values from the environment and only add a default
// for remote non-local Postgres hosts (for example Neon). This lets local Docker
// Postgres instances keep `sslmode=disable` without forcing TLS on startup.
const connectionStringWithSSL = normalizeDatabaseUrl(connectionString);

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