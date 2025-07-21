export const JWT_CONSTANTS = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key',
  EXPIRES_IN: '1d',
  REFRESH_EXPIRES_IN: '7d',
  ISSUER: 'forage-stores',
} as const;

export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: false,
} as const;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  WEAK_PASSWORD: 'Password does not meet requirements',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid token',
  ACCOUNT_LOCKED: 'Account has been locked',
} as const;

export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  TOKEN_REFRESH_LIMIT: 10,
} as const;
