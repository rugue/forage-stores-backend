import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { SupportTicket, SupportTicketSchema } from '../../entities/support-ticket.entity';
import { TicketMessage, TicketMessageSchema } from '../../entities/ticket-message.entity';
import { User, UserSchema } from '../../entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportTicket.name, schema: SupportTicketSchema },
      { name: TicketMessage.name, schema: TicketMessageSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
