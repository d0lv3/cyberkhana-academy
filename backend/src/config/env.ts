import dotenv from 'dotenv';

dotenv.config();

const WEAK_SECRETS = new Set([
  'change-this-in-production',
  'academy-dev-secret-change-in-production',
  'secret',
  'jwt-secret',
]);

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    // eslint-disable-next-line no-console
    console.error(`[env] Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const jwtSecret = required('JWT_SECRET');
if (isProduction && (jwtSecret.length < 32 || WEAK_SECRETS.has(jwtSecret))) {
  // eslint-disable-next-line no-console
  console.error('[env] Refusing to start in production with a weak or default JWT_SECRET (need ≥32 random chars).');
  process.exit(1);
}

/** Dev login is double-gated: explicit env flag AND never in production. */
const allowDevLogin = !isProduction && process.env.ALLOW_DEV_LOGIN === 'true';

export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 5002),
  mongoUri: required('MONGODB_URI'),
  jwtSecret,
  jwtExpiresIn: '7d' as const,
  cookieName: 'academy_token',
  frontendOrigins: [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((o) => o.trim()) : []),
  ].filter(Boolean),
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  allowDevLogin,
  trustProxy: Number(process.env.TRUST_PROXY || 0),
};
