import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ProductsNestController } from './products.controller.js';
import { ProductsNestService } from './products.service.js';

@Module({
  controllers: [ProductsNestController],
  providers: [AuthGuard, RolesGuard, ProductsNestService],
})
export class ProductsModule {}