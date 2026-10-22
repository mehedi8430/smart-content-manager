import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import routes from './routes';
import errorHandler from './middleware/errorHandler.middleware';
import { globalLimiter } from './middleware/rateLimit.middleware';
import logger from './config/logger.config';
import cookieParser from 'cookie-parser';
import { prisma } from './config/db.config';
import { env, corsOrigins } from './config/env.config';
import * as Sentry from '@sentry/node';

const app: Application = express();

app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS: only ever allow the explicit CORS_ORIGIN allowlist. Never fall back to
// `*` — that is invalid with `credentials: true` and would let any site call
// the API with the user's cookies. In production env.config.ts already fails
// fast when CORS_ORIGIN is missing; the guard below also covers a value that
// parses down to an empty list.
if (env.NODE_ENV === 'production' && corsOrigins.length === 0) {
  throw new Error('CORS_ORIGIN must contain at least one origin in production');
}

if (corsOrigins.length > 0) {
  app.use(
    cors({
      origin: (origin, callback) => {
        // Requests without an Origin header (curl, server-to-server) are not
        // subject to CORS; allow them through and let auth guard the route.
        if (!origin || corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    })
  );
}

// Cookie parsing middleware
app.use(cookieParser());

// Rate limiting
app.use('/api', globalLimiter);

// Body parsing middlewares. 100kb is plenty for this API's JSON payloads
// (longest realistic input is an AI prompt / chat message well under that).
// Raise per-route only if a route provably needs more.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

// Routes
app.use('/api/v1', routes);

// Health check - also pings the database so external uptime monitors (cron-job.org, UptimeRobot, GitHub Actions) can keep this service warm and avoid Render's cold start lag on the first login after idle.
// IMPORTANT: this must be registered BEFORE the 404 handler below,
// since Express matches middleware/routes in registration order
app.get('/health', async (_req: Request, res: Response) => {
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

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Must follow all routes and precede the centralized response handler.
Sentry.setupExpressErrorHandler(app);

// Error handling middleware
app.use(errorHandler);

export default app;
