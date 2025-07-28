import { Controller, Post, Body, UseGuards, Param, Get } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { NotificationDto } from './dto/notification.dto';
import { EmailNotificationDto } from './dto/email-notification.dto';
import { PushNotificationDto } from './dto/push-notification.dto';
import { WhatsAppNotificationDto } from './dto/whatsapp-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  async sendEmail(@Body() emailDto: EmailNotificationDto) {
    const result = await this.notificationsService.sendEmail(emailDto);
    return { success: result };
  }

  @Post('push')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  async sendPushNotification(@Body() pushDto: PushNotificationDto) {
    const result = await this.notificationsService.sendPushNotification(pushDto);
    return { success: result };
  }

  @Post('whatsapp')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async sendWhatsAppMessage(@Body() whatsappDto: WhatsAppNotificationDto) {
    const result = await this.notificationsService.sendWhatsAppMessage(whatsappDto);
    return { success: result };
  }

  @Post('order/:orderId/status-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async notifyOrderUpdate(
    @Param('orderId') orderId: string,
    @Body() body: { userId: string; status: string; additionalInfo?: Record<string, any> }
  ) {
    await this.notificationsService.notifyOrderUpdate(
      body.userId,
      orderId,
      body.status,
      body.additionalInfo
    );
    return { success: true };
  }

  @Post('payment/:subscriptionId/late')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async notifyLatePayment(
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: { 
      userId: string; 
      daysLate: number; 
      amountDue: number; 
      currency?: string 
    }
  ) {
    await this.notificationsService.notifyLatePayment(
      body.userId,
      subscriptionId,
      body.daysLate,
      body.amountDue,
      body.currency
    );
    return { success: true };
  }

  @Post('auction/:auctionId/event')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async notifyAuctionEvent(
    @Param('auctionId') auctionId: string,
    @Body() body: { 
      userId: string; 
      eventType: 'start' | 'bid' | 'outbid' | 'ending_soon' | 'won' | 'lost' | 'cancelled';
      additionalInfo?: Record<string, any> 
    }
  ) {
    await this.notificationsService.notifyAuctionEvent(
      body.userId,
      auctionId,
      body.eventType,
      body.additionalInfo
    );
    return { success: true };
  }

  @Post('rider/:riderId/assignment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async notifyRiderAssignment(
    @Param('riderId') riderId: string,
    @Body() body: { 
      orderId: string; 
      expiryTime: Date; 
      deliveryDetails: Record<string, any> 
    }
  ) {
    await this.notificationsService.notifyRiderAssignment(
      riderId,
      body.orderId,
      new Date(body.expiryTime),
      body.deliveryDetails
    );
    return { success: true };
  }
}
