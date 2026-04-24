import { Injectable } from '@nestjs/common';
import type { UserRole } from '../../models/enums.js';
import { createWompiCheckoutForOrder } from '../../services/payment.service.js';
import {
  createOrderService,
  getOrderByIdService,
  listMyOrdersService,
  listOrdersService,
  updateOrderStatusService,
} from '../../services/order.service.js';
import type { CreateOrderCheckoutDto, CreateOrderDto, ListOrdersQueryDto, UpdateOrderStatusDto } from './dto/orders.dto.js';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class OrdersNestService {
  createOrder(actor: ActorContext, data: CreateOrderDto) {
    return createOrderService(actor, data);
  }

  listMyOrders(userId: string) {
    return listMyOrdersService(userId);
  }

  listOrders(query: ListOrdersQueryDto) {
    return listOrdersService({
      ...(typeof query.status === 'string' && { status: query.status }),
      ...(typeof query.userId === 'string' && { userId: query.userId }),
      page: Number(query.page ?? '1'),
      limit: Number(query.limit ?? '20'),
    });
  }

  getOrderById(id: string, actor: ActorContext) {
    return getOrderByIdService(id, actor);
  }

  updateOrderStatus(id: string, data: UpdateOrderStatusDto) {
    return updateOrderStatusService(id, data.status);
  }

  createWompiCheckout(id: string, actor: ActorContext, data: CreateOrderCheckoutDto) {
    return createWompiCheckoutForOrder(id, actor, data);
  }
}