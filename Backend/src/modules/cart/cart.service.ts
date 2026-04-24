import { Injectable } from '@nestjs/common';
import type { UserRole } from '../../models/enums.js';
import {
  addCartItemService,
  checkoutCartService,
  clearCartService,
  getMyCartService,
  removeCartItemService,
  updateCartItemService,
} from '../../services/cart.service.js';
import type { AddCartItemDto, CheckoutCartDto, RemoveCartItemDto, UpdateCartItemDto } from './dto/cart.dto.js';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class CartNestService {
  getMyCart(userId: string) {
    return getMyCartService(userId);
  }

  addItem(actor: ActorContext, data: AddCartItemDto) {
    return addCartItemService(actor, data);
  }

  updateItem(actor: ActorContext, data: UpdateCartItemDto) {
    return updateCartItemService(actor, data);
  }

  removeItem(actor: ActorContext, data: RemoveCartItemDto) {
    return removeCartItemService(actor, data);
  }

  clear(actor: ActorContext) {
    return clearCartService(actor);
  }

  checkout(actor: ActorContext, data: CheckoutCartDto) {
    return checkoutCartService(actor, data);
  }
}