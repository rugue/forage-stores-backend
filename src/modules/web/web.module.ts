import { Module } from '@nestjs/common';
import { WebController } from './web.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WebController],
})
export class WebModule {}
