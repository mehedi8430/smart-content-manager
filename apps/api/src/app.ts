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

const app: Application = express();

app.set('trust proxy', 1);

// TEMPORARY (security review): enable DEBUG_REQUEST_IP=true to log how the
// client IP arrives. Used to work out the correct `trust proxy` hop count
// behind the Next.js rewrite + Render proxy. Remove once verified.
if (process.env.DEBUG_REQUEST_IP === 'true') {
  app.use((req: Request, _res: Response, next) => {
    logger.info('request-ip-debug', {
      ip: req.ip,
      ips: req.ips,
      xForwardedFor: req.headers['x-forwarded-for'],
      xRealIp: req.headers['x-real-ip'],
      path: req.originalUrl,
    });
    next();
  });
}

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

// Body parsing middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Error handling middleware
app.use(errorHandler);

export default app;
