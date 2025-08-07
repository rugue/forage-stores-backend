/**
 * Security Module Constants
 */

export const SECURITY_CONSTANTS = {
  // Two-Factor Authentication
  TWO_FA: {
    SECRET_LENGTH: 32,
    TOKEN_WINDOW: 2, // Allow tokens from 2 windows before/after
    TOKEN_LENGTH: 6,
    ISSUER_NAME: 'Forage Stores',
    QR_CODE_SIZE: 200,
    BACKUP_CODES_COUNT: 8,
    BACKUP_CODE_LENGTH: 8,
    MAX_FAILED_ATTEMPTS: 3,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
    VERIFICATION_EXPIRY: 5 * 60 * 1000, // 5 minutes
  },

  // Audit Logging
  AUDIT: {
    RETENTION_DAYS: 365,
    MAX_LOG_SIZE: 1000, // Maximum logs to keep in memory
    BATCH_SIZE: 100,
    ALERT_THRESHOLD_MINUTES: 5, // Alert if critical events within this time
    AUTO_CLEANUP_ENABLED: true,
    CRITICAL_EVENTS_LIMIT: 50,
    HIGH_RISK_THRESHOLD: 70,
    CRITICAL_RISK_THRESHOLD: 85,
  },

  // Threat Detection
  THREAT_DETECTION: {
    FAILED_LOGIN_THRESHOLD: 5, // Failed attempts before blocking
    FAILED_LOGIN_WINDOW: 10 * 60 * 1000, // 10 minutes window
    IP_BLOCK_DURATION: 60 * 60 * 1000, // 1 hour
    SUSPICIOUS_ACTIVITY_THRESHOLD: 10,
    BRUTE_FORCE_THRESHOLD: 10,
    BRUTE_FORCE_WINDOW: 5 * 60 * 1000, // 5 minutes
    RATE_LIMIT_THRESHOLD: 100, // Requests per minute
    UNUSUAL_LOCATION_THRESHOLD: 500, // km from usual location
    MAX_THREAT_RETENTION_DAYS: 180,
    AUTO_BLOCK_THRESHOLD: 80, // Auto-block when risk score reaches this
    RISK_SCORE_WEIGHTS: {
      LOCATION_ANOMALY: 20,
      TIME_ANOMALY: 15,
      PATTERN_ANOMALY: 25,
      FREQUENCY_ANOMALY: 30,
      DEVICE_ANOMALY: 10,
    },
    HIGH_RISK_THRESHOLD: 70,
    INVESTIGATION_THRESHOLD: 60,
  },

  // Security Policies
  SECURITY: {
    MAX_CONCURRENT_SESSIONS: 5,
    SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours
    ADMIN_SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours for admin
    PASSWORD_HISTORY_LIMIT: 5,
    MIN_PASSWORD_LENGTH: 8,
    PASSWORD_EXPIRY_DAYS: 90,
    FORCE_2FA_FOR_ADMIN: true,
    REQUIRE_2FA_FOR_SENSITIVE_ACTIONS: true,
  },

  // Analytics
  ANALYTICS: {
    DEFAULT_REPORT_DAYS: 30,
    MAX_REPORT_DAYS: 365,
    DASHBOARD_REFRESH_INTERVAL: 60 * 1000, // 1 minute
    METRICS_CALCULATION_INTERVAL: 5 * 60 * 1000, // 5 minutes
  },

  // Error Messages
  ERRORS: {
    TWO_FA_NOT_ENABLED: 'Two-factor authentication is not enabled',
    TWO_FA_NOT_FOUND: 'Two-factor authentication configuration not found',
    TWO_FA_INVALID_TOKEN: 'Invalid two-factor authentication token',
    TWO_FA_EXPIRED_TOKEN: 'Two-factor authentication token has expired',
    TWO_FA_ACCOUNT_LOCKED: 'Account is locked due to too many failed attempts',
    TWO_FA_ALREADY_ENABLED: 'Two-factor authentication is already enabled',
    INVALID_BACKUP_CODE: 'Invalid backup code',
    INVALID_TWO_FA_CODE: 'Invalid two-factor authentication code',
    BACKUP_CODES_EXHAUSTED: 'All backup codes have been used',
    SECURITY_VIOLATION: 'Security violation detected',
    THREAT_DETECTED: 'Potential security threat detected',
    IP_BLOCKED: 'IP address has been blocked',
    INVALID_SECURITY_TOKEN: 'Invalid security token',
    AUDIT_LOG_NOT_FOUND: 'Audit log entry not found'
  },

  // Alert configuration
  ALERTS: {
    CRITICAL_EVENTS: [
      'CRITICAL_OPERATION',
      'SECURITY_VIOLATION', 
      'ACCOUNT_TAKEOVER_ATTEMPT',
      'PRIVILEGE_ESCALATION',
      'DATA_EXFILTRATION'
    ]
  },

  // Security patterns for threat detection
  PATTERNS: {
    SUSPICIOUS_USER_AGENT: /bot|crawl|spider|scan|hack/i,
    SQL_INJECTION: /(\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bupdate\b|\bdrop\b|\bcreate\b|\balter\b)[\s\S]*(\bfrom\b|\binto\b|\bset\b|\bwhere\b)/i,
    XSS: /<script|javascript:|onload=|onerror=|onclick=/i
  }
};

// Admin actions that require 2FA
export const ADMIN_ACTIONS_REQUIRING_2FA = [
  'DELETE_USER',
  'MODIFY_USER_PERMISSIONS',
  'SYSTEM_CONFIGURATION',
  'BULK_OPERATIONS',
  'SECURITY_SETTINGS',
  'FINANCIAL_OPERATIONS',
  'DATA_EXPORT',
  'BACKUP_RESTORE',
  'USER_IMPERSONATION'
];

// Threat type descriptions
export const THREAT_TYPE_DESCRIPTIONS = {
  BRUTE_FORCE_ATTACK: 'Multiple failed login attempts detected from same IP/user',
  SUSPICIOUS_LOGIN_PATTERN: 'Unusual login pattern detected (location, time, frequency)',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded for API requests',
  ACCOUNT_TAKEOVER: 'Potential account takeover attempt detected',
  PRIVILEGE_ESCALATION: 'Attempt to escalate privileges detected',
  DATA_EXFILTRATION: 'Suspicious data access pattern detected',
  MALICIOUS_IP: 'Request from known malicious IP address',
  BOT_ACTIVITY: 'Automated bot activity detected',
  ANOMALOUS_BEHAVIOR: 'User behavior deviates significantly from normal patterns'
};
