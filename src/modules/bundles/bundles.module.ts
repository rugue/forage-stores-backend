import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { BundlesController, BundleOrdersController } from './bundles.controller';
import { BundlesService } from './bundles.service';
import { Bundle, BundleSchema } from './entities/bundle.entity';
import { BundleOrder, BundleOrderSchema } from './entities/bundle-order.entity';
import { BundleEventListener } from './listeners/bundle.listener';
import { Product, ProductSchema } from '../products/entities/product.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Notification, NotificationSchema } from '../notifications/entities/notification.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bundle.name, schema: BundleSchema },
      { name: BundleOrder.name, schema: BundleOrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    CacheModule.register(),
    NotificationsModule,
  ],
  controllers: [BundlesController, BundleOrdersController],
  providers: [BundlesService, BundleEventListener],
  exports: [BundlesService],
})
export class BundlesModule {}
