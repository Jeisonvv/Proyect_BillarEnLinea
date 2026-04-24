import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../models/enums.js';
import type { CreateOrderCheckoutDto, CreateOrderDto, ListOrdersQueryDto, UpdateOrderStatusDto } from './dto/orders.dto.js';
import { OrdersNestService } from './orders.service.js';

@Controller('api/orders')
@UseGuards(AuthGuard)
export class OrdersNestController {
  constructor(private readonly ordersService: OrdersNestService) {}

  @Post()
  async createOrder(@Req() req: Request, @Body() body: CreateOrderDto) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const order = await this.ordersService.createOrder(req.user, body);
      return { ok: true, data: order };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('me')
  async getMyOrders(@Req() req: Request) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const orders = await this.ordersService.listMyOrders(req.user.id);
      return { ok: true, data: orders, total: orders.length };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getOrders(@Query() query: ListOrdersQueryDto) {
    try {
      const page = Number(query.page ?? '1');
      const limit = Number(query.limit ?? '20');
      const { orders, total } = await this.ordersService.listOrders(query);
      return { ok: true, data: orders, pagination: { total, page, limit } };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  async getOrderById(@Req() req: Request, @Param('id') id: string) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const order = await this.ordersService.getOrderById(id, req.user);
      return { ok: true, data: order };
    } catch (error: any) {
      const status = error.message === 'Pedido no encontrado.'
        ? HttpStatus.NOT_FOUND
        : error.message === 'No tienes permiso para ver este pedido.'
          ? HttpStatus.FORBIDDEN
          : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post(':id/wompi/checkout')
  async createWompiCheckout(@Req() req: Request, @Param('id') id: string, @Body() body: CreateOrderCheckoutDto) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const data = await this.ordersService.createWompiCheckout(id, req.user, body);
      return { ok: true, data };
    } catch (error: any) {
      const status = error.message === 'Pedido no encontrado.'
        ? HttpStatus.NOT_FOUND
        : error.message === 'No tienes permiso para pagar este pedido.'
          ? HttpStatus.FORBIDDEN
          : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateOrderStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    try {
      const order = await this.ordersService.updateOrderStatus(id, body);
      return { ok: true, data: order };
    } catch (error: any) {
      const status = error.message === 'Pedido no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }
}