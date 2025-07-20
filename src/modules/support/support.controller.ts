import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  ForbiddenException
} from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../entities/user.entity';
import { 
  CreateTicketDto, 
  UpdateTicketDto, 
  CreateMessageDto,
  TicketQueryDto
} from './dto';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  /**
   * User Endpoints
   */
  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  async createTicket(
    @CurrentUser('id') userId: string,
    @Body() createTicketDto: CreateTicketDto
  ) {
    return this.supportService.createTicket(userId, createTicketDto);
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard)
  async getUserTickets(
    @CurrentUser('id') userId: string,
    @Query() query: TicketQueryDto
  ) {
    return this.supportService.getUserTickets(userId, query);
  }

  @Get('tickets/:id')
  @UseGuards(JwtAuthGuard)
  async getTicketById(
    @CurrentUser('id') userId: string,
    @Param('id') ticketId: string
  ) {
    return this.supportService.getTicketById(ticketId, userId);
  }

  @Get('tickets/:id/messages')
  @UseGuards(JwtAuthGuard)
  async getTicketMessages(
    @CurrentUser('id') userId: string,
    @Param('id') ticketId: string
  ) {
    return this.supportService.getTicketMessages(ticketId, userId);
  }

  @Post('tickets/:id/messages')
  @UseGuards(JwtAuthGuard)
  async addMessageToTicket(
    @CurrentUser('id') userId: string,
    @Param('id') ticketId: string,
    @Body() createMessageDto: CreateMessageDto
  ) {
    return this.supportService.addMessageToTicket(ticketId, userId, createMessageDto);
  }

  /**
   * Admin Endpoints
   */
  @Get('admin/tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllTickets(
    @CurrentUser('id') adminId: string,
    @Query() query: TicketQueryDto
  ) {
    return this.supportService.getAllTickets(adminId, query);
  }

  @Patch('admin/tickets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateTicket(
    @CurrentUser('id') adminId: string,
    @Param('id') ticketId: string,
    @Body() updateTicketDto: UpdateTicketDto
  ) {
    return this.supportService.updateTicket(ticketId, adminId, updateTicketDto);
  }

  @Post('admin/tickets/:id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async closeTicket(
    @CurrentUser('id') adminId: string,
    @Param('id') ticketId: string,
    @Body('message') message?: string
  ) {
    return this.supportService.closeTicket(ticketId, adminId, message);
  }

  @Get('admin/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getTicketAnalytics(
    @CurrentUser('id') adminId: string
  ) {
    return this.supportService.getTicketAnalytics(adminId);
  }
}
