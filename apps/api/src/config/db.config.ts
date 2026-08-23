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

const pool = new Pool({ connectionString: connectionStringWithSSL });
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