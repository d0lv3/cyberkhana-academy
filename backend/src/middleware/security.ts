import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/** Global API limit. */
export const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});

/** Stricter limit for authentication endpoints (brute-force resistance). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, try again later.' },
});

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF belt-and-braces on top of sameSite=lax cookies: state-changing
 * requests that carry a browser Origin header must come from an allowed
 * frontend origin. Requests without an Origin (curl, server-to-server with
 * Bearer tokens) pass through — they don't ride on ambient cookies.
 */
export function originGuard(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATING.has(req.method)) {
    next();
    return;
  }
  const origin = req.headers.origin;
  if (origin && !env.frontendOrigins.includes(origin)) {
    res.status(403).json({ error: 'Cross-origin request blocked' });
    return;
  }
  next();
}
