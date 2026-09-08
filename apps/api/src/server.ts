import { config } from 'dotenv';
import app from './app';
import logger from './config/logger.config';
import { connectDB, disconnectDB, prisma } from './config/db.config';

// Load environment variables first
config();
// Connect to database
connectDB();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', async (err: Error) => {
  logger.error('Uncaught Exception:', err);
  await disconnectDB();
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  server.close(async () => {
    await disconnectDB();
    logger.info('Process terminated');
  });
});

// Health check - also pings the database so external uptime monitors
// (cron-job.org, UptimeRobot) can keep this service warm and avoid
// Render's cold start lag on the first login after idle.
app.get("/health", async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      success: true,
      message: 'Api is healthy',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      success: false,
      message: 'Api is unhealthy',
      db: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});
