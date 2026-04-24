import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CartNestController } from './cart.controller.js';
import { CartNestService } from './cart.service.js';

@Module({
  controllers: [CartNestController],
  providers: [AuthGuard, CartNestService],
})
export class CartModule {}