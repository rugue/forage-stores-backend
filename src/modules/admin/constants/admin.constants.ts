import { AdminRole, AdminPermission } from '../interfaces/admin.interface';

/**
 * Admin-related constants and configurations
 */
export const ADMIN_CONSTANTS = {
  // Collection name
  COLLECTION_NAME: 'admins',
  
  // Security settings
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_TIME: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_RESET_EXPIRES: 10 * 60 * 1000, // 10 minutes
  
  // Session settings
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours
  REFRESH_TOKEN_EXPIRES: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Role-based permission mappings
 */
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  [AdminRole.SUPER_ADMIN]: [
    AdminPermission.VIEW_USERS,
    AdminPermission.EDIT_USERS,
    AdminPermission.DELETE_USERS,
    AdminPermission.VIEW_STORES,
    AdminPermission.EDIT_STORES,
    AdminPermission.DELETE_STORES,
    AdminPermission.APPROVE_STORES,
    AdminPermission.VIEW_PRODUCTS,
    AdminPermission.EDIT_PRODUCTS,
    AdminPermission.DELETE_PRODUCTS,
    AdminPermission.VIEW_ORDERS,
    AdminPermission.EDIT_ORDERS,
    AdminPermission.CANCEL_ORDERS,
    AdminPermission.VIEW_TRANSACTIONS,
    AdminPermission.PROCESS_PAYMENTS,
    AdminPermission.VIEW_REPORTS,
    AdminPermission.MANAGE_ADMINS,
    AdminPermission.VIEW_LOGS,
    AdminPermission.SYSTEM_SETTINGS,
  ],
  [AdminRole.ADMIN]: [
    AdminPermission.VIEW_USERS,
    AdminPermission.EDIT_USERS,
    AdminPermission.VIEW_STORES,
    AdminPermission.EDIT_STORES,
    AdminPermission.APPROVE_STORES,
    AdminPermission.VIEW_PRODUCTS,
    AdminPermission.EDIT_PRODUCTS,
    AdminPermission.VIEW_ORDERS,
    AdminPermission.EDIT_ORDERS,
    AdminPermission.CANCEL_ORDERS,
    AdminPermission.VIEW_TRANSACTIONS,
    AdminPermission.VIEW_REPORTS,
    AdminPermission.VIEW_LOGS,
  ],
  [AdminRole.MODERATOR]: [
    AdminPermission.VIEW_USERS,
    AdminPermission.VIEW_STORES,
    AdminPermission.VIEW_PRODUCTS,
    AdminPermission.EDIT_PRODUCTS,
    AdminPermission.VIEW_ORDERS,
    AdminPermission.EDIT_ORDERS,
    AdminPermission.VIEW_TRANSACTIONS,
  ],
  [AdminRole.SUPPORT]: [
    AdminPermission.VIEW_USERS,
    AdminPermission.VIEW_STORES,
    AdminPermission.VIEW_PRODUCTS,
    AdminPermission.VIEW_ORDERS,
    AdminPermission.EDIT_ORDERS,
  ],
};

/**
 * Default admin configuration
 */
export const ADMIN_DEFAULTS = {
  isActive: true,
  loginAttempts: 0,
  permissions: [],
  role: AdminRole.SUPPORT,
} as const;

/**
 * Admin validation rules
 */
export const ADMIN_VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
} as const;

/**
 * Admin error messages
 */
export const ADMIN_ERROR_MESSAGES = {
  NOT_FOUND: 'Admin not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed login attempts',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',
  DUPLICATE_EMAIL: 'Admin with this email already exists',
  INVALID_EMAIL: 'Please provide a valid email address',
  WEAK_PASSWORD: 'Password must contain at least 8 characters with uppercase, lowercase, number and special character',
  INVALID_ROLE: 'Invalid admin role specified',
  CANNOT_DELETE_SELF: 'Cannot delete your own admin account',
  CANNOT_DEMOTE_SELF: 'Cannot demote your own admin role',
  SUPER_ADMIN_REQUIRED: 'Super admin privileges required for this action',
} as const;

/**
 * Admin success messages
 */
export const ADMIN_SUCCESS_MESSAGES = {
  CREATED: 'Admin account created successfully',
  UPDATED: 'Admin account updated successfully',
  DELETED: 'Admin account deleted successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  ACCOUNT_ACTIVATED: 'Admin account activated successfully',
  ACCOUNT_DEACTIVATED: 'Admin account deactivated successfully',
} as const;

/**
 * Admin activity log types
 */
export const ADMIN_ACTIVITY_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PROFILE_UPDATE: 'profile_update',
  USER_ACTION: 'user_action',
  STORE_ACTION: 'store_action',
  PRODUCT_ACTION: 'product_action',
  ORDER_ACTION: 'order_action',
  SYSTEM_ACTION: 'system_action',
} as const;
