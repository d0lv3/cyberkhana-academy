import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import User, { IUser } from '../models/User';
import type { IJWTPayload, UserRole } from '../types';

export interface AuthRequest extends Request {
  user?: IUser;
}

function extractToken(req: Request): string | null {
  // Primary: httpOnly cookie (immune to XSS token theft).
  const cookieToken = req.cookies?.[env.cookieName];
  if (typeof cookieToken === 'string' && cookieToken) return cookieToken;
  // Fallback: Authorization header (API tooling / tests).
  const authHeader = req.headers.authorization;
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

export function signToken(userId: string): string {
  return jwt.sign({ userId } satisfies IJWTPayload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
  });
}

/**
 * Verifies the JWT, then loads the user from the DB so bans and role changes
 * take effect immediately (the token itself carries only the user id).
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  let payload: IJWTPayload;
  try {
    payload = jwt.verify(token, env.jwtSecret) as IJWTPayload;
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  try {
    const user = await User.findById(payload.userId);
    if (!user || user.isBanned) {
      clearAuthCookie(res);
      res.status(401).json({ error: 'Account unavailable' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/** Role gate — use AFTER authenticate. */
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

export const requireAdmin = requireRole('admin');
