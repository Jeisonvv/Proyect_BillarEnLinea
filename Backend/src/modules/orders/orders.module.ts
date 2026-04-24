import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { OrdersNestController } from './orders.controller.js';
import { OrdersNestService } from './orders.service.js';

@Module({
  controllers: [OrdersNestController],
  providers: [AuthGuard, RolesGuard, OrdersNestService],
})
export class OrdersModule {}