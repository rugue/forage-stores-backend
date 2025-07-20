import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document, Schema } from 'mongoose';
import { 
  SupportTicket, 
  SupportTicketDocument,
  TicketStatus,
  TicketPriority
} from '../../entities/support-ticket.entity';
import { 
  TicketMessage, 
  TicketMessageDocument,
  MessageSender
} from '../../entities/ticket-message.entity';
import { User, UserDocument, UserRole } from '../../entities/user.entity';
import { 
  CreateTicketDto, 
  UpdateTicketDto, 
  CreateMessageDto,
  TicketQueryDto
} from './dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportTicket.name) private ticketModel: Model<SupportTicketDocument>,
    @InjectModel(TicketMessage.name) private messageModel: Model<TicketMessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Helper function to safely get ObjectId from document
  private getDocumentId(doc: any): Schema.Types.ObjectId {
    if (doc._id) {
      if (typeof doc._id === 'string') {
        return new Types.ObjectId(doc._id) as unknown as Schema.Types.ObjectId;
      } else if (doc._id instanceof Types.ObjectId) {
        return doc._id as unknown as Schema.Types.ObjectId;
      } else if (typeof doc._id.toString === 'function') {
        return new Types.ObjectId(doc._id.toString()) as unknown as Schema.Types.ObjectId;
      }
    }
    return doc as unknown as Schema.Types.ObjectId;
  }

  /**
   * Ticket Management - User Operations
   */
  async createTicket(userId: string, createTicketDto: CreateTicketDto): Promise<SupportTicket> {
    // Verify user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Create a new ticket
    const newTicket = new this.ticketModel({
      userId: new Types.ObjectId(userId),
      subject: createTicketDto.subject,
      category: createTicketDto.category,
      priority: createTicketDto.priority || TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
      lastUpdatedAt: new Date(),
      metadata: createTicketDto.metadata || {},
      messages: [],
    });

    // Save the ticket
    const savedTicket = await newTicket.save();

    // Create the initial message
    const initialMessage = new this.messageModel({
      ticketId: savedTicket._id,
      senderId: new Types.ObjectId(userId),
      senderType: MessageSender.USER,
      message: createTicketDto.message,
      attachments: createTicketDto.attachments || [],
      isRead: false,
    });

    const savedMessage = await initialMessage.save();

    // Update the ticket with the message ID
    savedTicket.messages.push(this.getDocumentId(savedMessage) as any);
    await savedTicket.save();

    return this.getTicketById(savedTicket._id.toString(), userId);
  }

  async getUserTickets(userId: string, query: TicketQueryDto = {}): Promise<{ tickets: SupportTicket[], total: number }> {
    const filter: any = { userId: new Types.ObjectId(userId) };

    // Apply status filter if provided
    if (query.status) {
      filter.status = query.status;
    }

    // Apply category filter if provided
    if (query.category) {
      filter.category = query.category;
    }

    // Apply priority filter if provided
    if (query.priority) {
      filter.priority = query.priority;
    }

    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const total = await this.ticketModel.countDocuments(filter);
    const tickets = await this.ticketModel.find(filter)
      .populate('userId', 'name email phone')
      .populate('assignedTo', 'name email')
      .sort({ lastUpdatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      tickets,
      total
    };
  }

  async getTicketById(ticketId: string, userId: string): Promise<SupportTicket> {
    const ticket = await this.ticketModel.findById(ticketId)
      .populate('userId', 'name email phone')
      .populate('assignedTo', 'name email')
      .exec();

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    // Check if the requester is the ticket owner or an admin
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if ((ticket.userId as any)?._id && (ticket.userId as any)._id.toString() !== userId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to view this ticket');
    }

    return ticket;
  }

  async addMessageToTicket(
    ticketId: string,
    userId: string,
    createMessageDto: CreateMessageDto
  ): Promise<TicketMessage> {
    // Verify ticket exists
    const ticket = await this.ticketModel.findById(ticketId);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    // Verify user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if the ticket is closed
    if (ticket.status === TicketStatus.CLOSED) {
      throw new BadRequestException('Cannot add message to a closed ticket');
    }

    // Determine sender type
    const senderType = user.role === UserRole.ADMIN ? MessageSender.ADMIN : MessageSender.USER;

    // Check if internal note is allowed (admin only)
    if (createMessageDto.isInternal && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create internal notes');
    }

    // Create the message
    const newMessage = new this.messageModel({
      ticketId: new Types.ObjectId(ticketId),
      senderId: new Types.ObjectId(userId),
      senderType,
      message: createMessageDto.message,
      attachments: createMessageDto.attachments || [],
      isInternal: createMessageDto.isInternal || false,
      isRead: false,
    });

    const savedMessage = await newMessage.save();

    // Update the ticket with the message ID and update status if needed
    ticket.messages.push(this.getDocumentId(savedMessage) as any);
    ticket.lastUpdatedAt = new Date();

    // If user replies to a resolved ticket, reopen it
    if (ticket.status === TicketStatus.RESOLVED && senderType === MessageSender.USER) {
      ticket.status = TicketStatus.OPEN;
    }

    // If admin replies to an open ticket, change status to in progress
    if (ticket.status === TicketStatus.OPEN && senderType === MessageSender.ADMIN) {
      ticket.status = TicketStatus.IN_PROGRESS;
    }

    await ticket.save();

    return savedMessage;
  }

  async getTicketMessages(ticketId: string, userId: string): Promise<TicketMessage[]> {
    // Verify ticket exists
    const ticket = await this.getTicketById(ticketId, userId);

    // Determine if user is admin
    const user = await this.userModel.findById(userId);
    const isAdmin = user.role === UserRole.ADMIN;

    // Query for messages
    let messagesQuery = this.messageModel.find({ ticketId: new Types.ObjectId(ticketId) });

    // Filter out internal notes if user is not admin
    if (!isAdmin) {
      messagesQuery = messagesQuery.find({ isInternal: { $ne: true } });
    }

    const messages = await messagesQuery
      .populate('senderId', 'name email role')
      .sort({ createdAt: 1 })
      .exec();

    // Mark messages as read if they were sent by the other party
    if (messages.length > 0) {
      const otherPartyMessages = messages.filter(message => {
        return (message.senderId as any)._id && 
               (message.senderId as any)._id.toString() !== userId && 
               !message.isRead;
      });

      if (otherPartyMessages.length > 0) {
        await this.messageModel.updateMany(
          {
            _id: { $in: otherPartyMessages.map(m => m._id) }
          },
          {
            $set: { isRead: true, readAt: new Date() }
          }
        );
      }
    }

    return messages;
  }

  /**
   * Ticket Management - Admin Operations
   */
  async updateTicket(ticketId: string, adminId: string, updateTicketDto: UpdateTicketDto): Promise<SupportTicket> {
    // Verify ticket exists
    const ticket = await this.ticketModel.findById(ticketId);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    // Verify admin exists and has correct role
    const admin = await this.userModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${adminId} not found`);
    }

    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update tickets');
    }

    // If assignedTo is being updated, verify the assigned user exists and is an admin
    if (updateTicketDto.assignedTo) {
      const assignedUser = await this.userModel.findById(updateTicketDto.assignedTo);
      if (!assignedUser) {
        throw new NotFoundException(`User with ID ${updateTicketDto.assignedTo} not found`);
      }

      if (assignedUser.role !== UserRole.ADMIN) {
        throw new BadRequestException('Tickets can only be assigned to admins');
      }
    }

    // Update the ticket
    const updateData: any = {
      lastUpdatedAt: new Date(),
      ...updateTicketDto
    };

    // If the status is being updated to RESOLVED, add a system message
    if (updateTicketDto.status === TicketStatus.RESOLVED && ticket.status !== TicketStatus.RESOLVED) {
      const systemMessage = new this.messageModel({
        ticketId: new Types.ObjectId(ticketId),
        senderId: new Types.ObjectId(adminId),
        senderType: MessageSender.SYSTEM,
        message: `Ticket marked as resolved by ${admin.name || 'an admin'}.`,
        isRead: false,
      });

      const savedMessage = await systemMessage.save();
      ticket.messages.push(this.getDocumentId(savedMessage) as any);
      updateData.messages = ticket.messages;
    }

    // If the status is being updated to ESCALATED, add a system message
    if (updateTicketDto.isEscalated && !ticket.isEscalated) {
      const systemMessage = new this.messageModel({
        ticketId: new Types.ObjectId(ticketId),
        senderId: new Types.ObjectId(adminId),
        senderType: MessageSender.SYSTEM,
        message: `Ticket has been escalated by ${admin.name || 'an admin'}.`,
        isRead: false,
      });

      const savedMessage = await systemMessage.save();
      ticket.messages.push(this.getDocumentId(savedMessage) as any);
      updateData.messages = ticket.messages;
    }

    const updatedTicket = await this.ticketModel.findByIdAndUpdate(
      ticketId,
      updateData,
      { new: true }
    )
    .populate('userId', 'name email phone')
    .populate('assignedTo', 'name email')
    .exec();

    return updatedTicket;
  }

  async getAllTickets(adminId: string, query: TicketQueryDto = {}): Promise<{ tickets: SupportTicket[], total: number }> {
    // Verify admin exists and has correct role
    const admin = await this.userModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${adminId} not found`);
    }

    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view all tickets');
    }

    const filter: any = {};

    // Apply status filter if provided
    if (query.status) {
      filter.status = query.status;
    }

    // Apply category filter if provided
    if (query.category) {
      filter.category = query.category;
    }

    // Apply priority filter if provided
    if (query.priority) {
      filter.priority = query.priority;
    }

    // Apply user filter if provided
    if (query.userId) {
      filter.userId = new Types.ObjectId(query.userId);
    }

    // Apply assignedTo filter if provided
    if (query.assignedTo) {
      filter.assignedTo = new Types.ObjectId(query.assignedTo);
    }

    // Apply escalation filter if provided
    if (query.isEscalated !== undefined) {
      filter.isEscalated = query.isEscalated;
    }

    // Apply search term if provided
    if (query.searchTerm) {
      filter.$or = [
        { subject: { $regex: query.searchTerm, $options: 'i' } },
      ];
    }

    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const total = await this.ticketModel.countDocuments(filter);
    const tickets = await this.ticketModel.find(filter)
      .populate('userId', 'name email phone')
      .populate('assignedTo', 'name email')
      .sort({ lastUpdatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      tickets,
      total
    };
  }

  async closeTicket(ticketId: string, adminId: string, message?: string): Promise<SupportTicket> {
    // Verify ticket exists
    const ticket = await this.ticketModel.findById(ticketId);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    // Verify admin exists and has correct role
    const admin = await this.userModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${adminId} not found`);
    }

    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can close tickets');
    }

    // Add a system message
    const systemMessage = new this.messageModel({
      ticketId: new Types.ObjectId(ticketId),
      senderId: new Types.ObjectId(adminId),
      senderType: MessageSender.SYSTEM,
      message: message || `Ticket closed by ${admin.name || 'an admin'}.`,
      isRead: false,
    });

    const savedMessage = await systemMessage.save();
    ticket.messages.push(this.getDocumentId(savedMessage) as any);

    // Update the ticket
    const updatedTicket = await this.ticketModel.findByIdAndUpdate(
      ticketId,
      {
        status: TicketStatus.CLOSED,
        lastUpdatedAt: new Date(),
        messages: ticket.messages
      },
      { new: true }
    )
    .populate('userId', 'name email phone')
    .populate('assignedTo', 'name email')
    .exec();

    return updatedTicket;
  }

  /**
   * Analytics
   */
  async getTicketAnalytics(adminId: string): Promise<any> {
    // Verify admin exists and has correct role
    const admin = await this.userModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${adminId} not found`);
    }

    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view ticket analytics');
    }

    // Get all tickets
    const tickets = await this.ticketModel.find().exec();

    // Calculate analytics
    const analytics = {
      totalTickets: tickets.length,
      ticketsByStatus: {
        [TicketStatus.OPEN]: 0,
        [TicketStatus.IN_PROGRESS]: 0,
        [TicketStatus.RESOLVED]: 0,
        [TicketStatus.ESCALATED]: 0,
        [TicketStatus.CLOSED]: 0,
      },
      ticketsByPriority: {
        [TicketPriority.LOW]: 0,
        [TicketPriority.MEDIUM]: 0,
        [TicketPriority.HIGH]: 0,
        [TicketPriority.URGENT]: 0,
      },
      ticketsByCategory: {},
      escalatedTickets: 0,
      averageResponseTime: 0, // in hours
      averageResolutionTime: 0, // in days
    };

    // Count by status, priority, and category
    tickets.forEach(ticket => {
      // Count by status
      analytics.ticketsByStatus[ticket.status]++;

      // Count by priority
      analytics.ticketsByPriority[ticket.priority]++;

      // Count by category
      if (!analytics.ticketsByCategory[ticket.category]) {
        analytics.ticketsByCategory[ticket.category] = 0;
      }
      analytics.ticketsByCategory[ticket.category]++;

      // Count escalated tickets
      if (ticket.isEscalated) {
        analytics.escalatedTickets++;
      }
    });

    // Calculate average response time and resolution time
    const ticketsWithResponses = await this.ticketModel.aggregate([
      {
        $lookup: {
          from: 'ticketmessages',
          localField: '_id',
          foreignField: 'ticketId',
          as: 'messages'
        }
      },
      {
        $match: {
          'messages.1': { $exists: true } // At least 2 messages
        }
      }
    ]);

    if (ticketsWithResponses.length > 0) {
      let totalResponseTime = 0;
      let ticketsWithResponseTime = 0;
      let totalResolutionTime = 0;
      let resolvedTickets = 0;

      for (const ticket of ticketsWithResponses) {
        // Sort messages by creation date
        const messages = ticket.messages.sort((a, b) => a.createdAt - b.createdAt);
        
        // First message is from user, second message is the response
        if (messages.length >= 2 && 
            messages[0].senderType === MessageSender.USER && 
            messages[1].senderType === MessageSender.ADMIN) {
          const responseTime = (new Date(messages[1].createdAt).getTime() - new Date(messages[0].createdAt).getTime()) / (1000 * 60 * 60); // hours
          totalResponseTime += responseTime;
          ticketsWithResponseTime++;
        }

        // Calculate resolution time for resolved tickets
        if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) {
          const resolutionTime = (new Date(ticket.lastUpdatedAt).getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60 * 24); // days
          totalResolutionTime += resolutionTime;
          resolvedTickets++;
        }
      }

      if (ticketsWithResponseTime > 0) {
        analytics.averageResponseTime = totalResponseTime / ticketsWithResponseTime;
      }

      if (resolvedTickets > 0) {
        analytics.averageResolutionTime = totalResolutionTime / resolvedTickets;
      }
    }

    return analytics;
  }
}
