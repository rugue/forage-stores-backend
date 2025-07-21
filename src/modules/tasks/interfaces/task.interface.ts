import { Document, Types } from 'mongoose';

/**
 * Task status enumeration
 */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
  SCHEDULED = 'scheduled',
}

/**
 * Task priority enumeration
 */
export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

/**
 * Task type enumeration
 */
export enum TaskType {
  EMAIL_NOTIFICATION = 'email_notification',
  SMS_NOTIFICATION = 'sms_notification',
  PUSH_NOTIFICATION = 'push_notification',
  ORDER_PROCESSING = 'order_processing',
  PAYMENT_PROCESSING = 'payment_processing',
  SUBSCRIPTION_RENEWAL = 'subscription_renewal',
  DELIVERY_ASSIGNMENT = 'delivery_assignment',
  AUCTION_COMPLETION = 'auction_completion',
  REFERRAL_PROCESSING = 'referral_processing',
  DATA_BACKUP = 'data_backup',
  REPORT_GENERATION = 'report_generation',
  CLEANUP = 'cleanup',
  SYNC = 'sync',
  WEBHOOK = 'webhook',
  BATCH_PROCESSING = 'batch_processing',
}

/**
 * Retry strategy enumeration
 */
export enum RetryStrategy {
  EXPONENTIAL_BACKOFF = 'exponential_backoff',
  LINEAR_BACKOFF = 'linear_backoff',
  FIXED_DELAY = 'fixed_delay',
  IMMEDIATE = 'immediate',
  NONE = 'none',
}

/**
 * Task execution context interface
 */
export interface ITaskContext {
  userId?: string;
  orderId?: string;
  deliveryId?: string;
  subscriptionId?: string;
  auctionId?: string;
  referralId?: string;
  [key: string]: any;
}

/**
 * Task retry configuration interface
 */
export interface IRetryConfig {
  strategy: RetryStrategy;
  maxRetries: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffMultiplier: number;
}

/**
 * Task execution log interface
 */
export interface ITaskExecutionLog {
  attempt: number;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // in milliseconds
  status: TaskStatus;
  error?: string;
  result?: any;
  metadata?: Record<string, any>;
}

/**
 * Task interface
 */
export interface ITask {
  name: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  payload: Record<string, any>;
  context: ITaskContext;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  attempts: number;
  maxAttempts: number;
  retryConfig: IRetryConfig;
  executionLogs: ITaskExecutionLog[];
  nextRetryAt?: Date;
  error?: string;
  result?: any;
  tags: string[];
  parentTaskId?: Types.ObjectId;
  dependsOn: Types.ObjectId[];
  timeout: number; // in milliseconds
  isRecurring: boolean;
  cronExpression?: string;
  lastExecutedAt?: Date;
  metadata: Record<string, any>;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Task document interface extending Mongoose Document
 */
export interface ITaskDocument extends ITask, Document {
  readonly isOverdue: boolean;
  readonly canRetry: boolean;
  readonly executionTime: number;
  readonly averageExecutionTime: number;
  readonly successRate: number;
}

/**
 * Task queue interface
 */
export interface ITaskQueue {
  name: string;
  description: string;
  isActive: boolean;
  concurrency: number;
  rateLimit: number; // tasks per minute
  priority: TaskPriority;
  retryConfig: IRetryConfig;
  taskTypes: TaskType[];
  processors: string[];
  statistics: IQueueStatistics;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Queue statistics interface
 */
export interface IQueueStatistics {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  throughput: number; // tasks per hour
  lastProcessedAt?: Date;
}

/**
 * Create task payload interface
 */
export interface ICreateTaskPayload {
  name: string;
  type: TaskType;
  payload: Record<string, any>;
  context?: ITaskContext;
  priority?: TaskPriority;
  scheduledAt?: Date;
  maxAttempts?: number;
  retryConfig?: Partial<IRetryConfig>;
  tags?: string[];
  dependsOn?: string[];
  timeout?: number;
  isRecurring?: boolean;
  cronExpression?: string;
  metadata?: Record<string, any>;
}

/**
 * Update task payload interface
 */
export interface IUpdateTaskPayload {
  status?: TaskStatus;
  priority?: TaskPriority;
  scheduledAt?: Date;
  maxAttempts?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Task query filters interface
 */
export interface ITaskQueryFilters {
  status?: TaskStatus;
  type?: TaskType;
  priority?: TaskPriority;
  tags?: string[];
  createdBy?: string;
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  isOverdue?: boolean;
  isRecurring?: boolean;
  parentTaskId?: string;
}

/**
 * Task statistics interface
 */
export interface ITaskStatistics {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  scheduledTasks: number;
  overdueTasks: number;
  recurringTasks: number;
  averageExecutionTime: number;
  successRate: number;
  byType: Record<TaskType, number>;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
}

/**
 * Task processor interface
 */
export interface ITaskProcessor {
  name: string;
  supportedTypes: TaskType[];
  execute(task: ITask): Promise<any>;
  validate?(payload: Record<string, any>): boolean;
  onSuccess?(task: ITask, result: any): Promise<void>;
  onError?(task: ITask, error: Error): Promise<void>;
}

/**
 * Task schedule options interface
 */
export interface ITaskScheduleOptions {
  timezone?: string;
  startDate?: Date;
  endDate?: Date;
  maxExecutions?: number;
  skipDuplicates?: boolean;
}

/**
 * Bulk task operation interface
 */
export interface IBulkTaskOperation {
  operation: 'create' | 'update' | 'cancel' | 'retry';
  filters?: ITaskQueryFilters;
  payload?: any;
  limit?: number;
}

/**
 * Task dependency interface
 */
export interface ITaskDependency {
  taskId: Types.ObjectId;
  dependsOnId: Types.ObjectId;
  condition: 'success' | 'completion' | 'failure';
  createdAt: Date;
}

/**
 * Task notification configuration interface
 */
export interface ITaskNotificationConfig {
  onSuccess: boolean;
  onFailure: boolean;
  onRetry: boolean;
  channels: ('email' | 'sms' | 'slack' | 'webhook')[];
  recipients: string[];
  webhookUrl?: string;
}
