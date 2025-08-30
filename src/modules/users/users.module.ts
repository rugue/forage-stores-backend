import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { User, UserSchema } from '../users/entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { FileUploadService } from './services/file-upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MulterModule.register({
      dest: './uploads/profiles',
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, FileUploadService],
  exports: [UsersService], // Export for use in other modules (like auth)
})
export class UsersModule {}
