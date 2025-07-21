import { Document, Types } from 'mongoose';

/**
 * Ticket status enumeration
 */
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

/**
 * Ticket priority enumeration
 */
export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

/**
 * Ticket category enumeration
 */
export enum TicketCategory {
  ACCOUNT = 'account',
  ORDER = 'order',
  PAYMENT = 'payment',
  DELIVERY = 'delivery',
  PRODUCT = 'product',
  TECHNICAL = 'technical',
  FEEDBACK = 'feedback',
  BILLING = 'billing',
  REFUND = 'refund',
  OTHER = 'other',
}

/**
 * Message type enumeration
 */
export enum MessageType {
  USER = 'user',
  AGENT = 'agent',
  SYSTEM = 'system',
  AUTO_REPLY = 'auto_reply',
}

/**
 * Attachment interface
 */
export interface IAttachment {
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

/**
 * Ticket message interface
 */
export interface ITicketMessage {
  senderId: Types.ObjectId;
  senderType: MessageType;
  content: string;
  attachments: IAttachment[];
  isInternal: boolean;
  timestamp: Date;
  readAt?: Date;
  editedAt?: Date;
}

/**
 * Support ticket interface
 */
export interface ISupportTicket {
  userId: Types.ObjectId;
  assignedAgentId?: Types.ObjectId;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  messages: ITicketMessage[];
  tags: string[];
  relatedOrderId?: Types.ObjectId;
  escalationLevel: number;
  responseDeadline?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  satisfactionRating?: number;
  satisfactionFeedback?: string;
  internalNotes: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Support ticket document interface
 */
export interface ISupportTicketDocument extends ISupportTicket, Document {
  readonly isOverdue: boolean;
  readonly responseTime: number;
  readonly resolutionTime: number;
  readonly messageCount: number;
  readonly lastActivity: Date;
}

/**
 * Support agent interface
 */
export interface ISupportAgent {
  userId: Types.ObjectId;
  name: string;
  email: string;
  department: string;
  specializations: TicketCategory[];
  isOnline: boolean;
  currentTicketCount: number;
  maxTicketCapacity: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  satisfactionRating: number;
  totalTicketsHandled: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create ticket payload interface
 */
export interface ICreateTicketPayload {
  userId: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  relatedOrderId?: string;
  attachments?: IAttachment[];
}

/**
 * Update ticket payload interface
 */
export interface IUpdateTicketPayload {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedAgentId?: string;
  tags?: string[];
  internalNotes?: string;
}

/**
 * Add message payload interface
 */
export interface IAddMessagePayload {
  ticketId: string;
  senderId: string;
  senderType: MessageType;
  content: string;
  attachments?: IAttachment[];
  isInternal?: boolean;
}

/**
 * Ticket query filters interface
 */
export interface ITicketQueryFilters {
  userId?: string;
  assignedAgentId?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  tags?: string[];
  isOverdue?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Support statistics interface
 */
export interface ISupportStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  overdueTickets: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  satisfactionRating: number;
  byCategory: Record<TicketCategory, number>;
  byPriority: Record<TicketPriority, number>;
  byStatus: Record<TicketStatus, number>;
}

/**
 * Agent performance interface
 */
export interface IAgentPerformance {
  agentId: Types.ObjectId;
  ticketsHandled: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  satisfactionRating: number;
  escalationRate: number;
  reopenRate: number;
}
