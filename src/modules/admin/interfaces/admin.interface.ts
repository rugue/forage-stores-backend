import { Document } from 'mongoose';

/**
 * Admin interface representing the admin data structure
 */
export interface IAdmin {
  email: string;
  name: string;
  password?: string;
  role: AdminRole;
  permissions: AdminPermission[];
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Admin document interface extending Mongoose Document
 */
export interface IAdminDocument extends IAdmin, Document {}

/**
 * Admin roles enumeration
 */
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support',
}

/**
 * Admin permissions enumeration
 */
export enum AdminPermission {
  // User management
  VIEW_USERS = 'view_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  
  // Store management
  VIEW_STORES = 'view_stores',
  EDIT_STORES = 'edit_stores',
  DELETE_STORES = 'delete_stores',
  APPROVE_STORES = 'approve_stores',
  
  // Product management
  VIEW_PRODUCTS = 'view_products',
  EDIT_PRODUCTS = 'edit_products',
  DELETE_PRODUCTS = 'delete_products',
  
  // Order management
  VIEW_ORDERS = 'view_orders',
  EDIT_ORDERS = 'edit_orders',
  CANCEL_ORDERS = 'cancel_orders',
  
  // Financial management
  VIEW_TRANSACTIONS = 'view_transactions',
  PROCESS_PAYMENTS = 'process_payments',
  VIEW_REPORTS = 'view_reports',
  
  // System administration
  MANAGE_ADMINS = 'manage_admins',
  VIEW_LOGS = 'view_logs',
  SYSTEM_SETTINGS = 'system_settings',
}

/**
 * Admin login response interface
 */
export interface IAdminLoginResponse {
  admin: IAdmin;
  accessToken: string;
  refreshToken: string;
}

/**
 * Admin creation payload interface
 */
export interface ICreateAdminPayload {
  email: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermission[];
  password: string;
}

/**
 * Admin update payload interface
 */
export interface IUpdateAdminPayload {
  name?: string;
  role?: AdminRole;
  permissions?: AdminPermission[];
  isActive?: boolean;
}

/**
 * Admin query filters interface
 */
export interface IAdminQueryFilters {
  role?: AdminRole;
  isActive?: boolean;
  search?: string;
  permissions?: AdminPermission[];
}

/**
 * Admin statistics interface
 */
export interface IAdminStats {
  totalAdmins: number;
  activeAdmins: number;
  byRole: Record<AdminRole, number>;
  recentLogins: number;
}
