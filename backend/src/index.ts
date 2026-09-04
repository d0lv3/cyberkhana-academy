import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import { apiLimiter, authLimiter, originGuard } from './middleware/security';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import collabRoutes from './routes/collab';
import contentRoutes from './routes/content';
import progressRoutes from './routes/progress';
import leaderboardRoutes from './routes/leaderboard';
import feedbackRoutes from './routes/feedback';
import adminRoutes from './routes/admin';
import uploadRoutes, { UPLOADS_DIR, LAB_RESOURCES_DIR } from './routes/uploads';

const app = express();

// Behind a reverse proxy in production set TRUST_PROXY=1 so rate-limit sees real IPs.
app.set('trust proxy', env.trustProxy);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.frontendOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(originGuard);
app.use('/api', apiLimiter);

app.use('/api', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/collab', collabRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);

/* Lab resources — creator-uploaded files students download to do the work.
 *
 * Registered before the image handler below so it wins on the shared prefix.
 * Everything here is forced to download as an opaque octet-stream: these files
 * come from creators rather than from us, and a document served inline from our
 * own origin can script against it. `attachment` plus `nosniff` means the
 * browser saves the bytes and never interprets them, whatever the extension. */
app.use(
  '/uploads/lab-resources',
  express.static(LAB_RESOURCES_DIR, {
    immutable: true,
    maxAge: '365d',
    index: false,
    dotfiles: 'deny',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

// Uploaded images — immutable random filenames, cache hard. CORP is relaxed
// here (and only here) so the frontend origin can embed the images.
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    immutable: true,
    maxAge: '365d',
    index: false,
    dotfiles: 'deny',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

// 404 — no route matched.
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Central error handler — never leak stack traces or internals.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'Origin not allowed' });
    return;
  }
  if ((err as { type?: string }).type === 'entity.too.large') {
    res.status(413).json({ error: 'Payload too large' });
    return;
  }
  logger.error('server.unhandled_error', { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

connectDatabase().then(() => {
  app.listen(env.port, () => {
    logger.info('server.started', {
      port: env.port,
      mode: env.nodeEnv,
      devLogin: env.allowDevLogin,
      googleAuth: Boolean(env.googleClientId),
    });
  });
});
