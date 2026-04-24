import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import type { AddCartItemDto, CheckoutCartDto, RemoveCartItemDto, UpdateCartItemDto } from './dto/cart.dto.js';
import { CartNestService } from './cart.service.js';

@Controller('api/cart')
@UseGuards(AuthGuard)
export class CartNestController {
  constructor(private readonly cartService: CartNestService) {}

  @Get()
  async getMyCart(@Req() req: Request) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const cart = await this.cartService.getMyCart(req.user.id);
      return { ok: true, data: cart };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('items')
  async addItem(@Req() req: Request, @Body() body: AddCartItemDto) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const cart = await this.cartService.addItem(req.user, body);
      return { ok: true, data: cart };
    } catch (error: any) {
      const status = error.message === 'Producto no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Patch('items')
  async updateItem(@Req() req: Request, @Body() body: UpdateCartItemDto) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const cart = await this.cartService.updateItem(req.user, body);
      return { ok: true, data: cart };
    } catch (error: any) {
      const status = error.message === 'Producto no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Delete('items')
  async removeItem(@Req() req: Request, @Body() body: RemoveCartItemDto) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const cart = await this.cartService.removeItem(req.user, body);
      return { ok: true, data: cart };
    } catch (error: any) {
      const status = error.message === 'Producto no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Delete()
  async clear(@Req() req: Request) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const cart = await this.cartService.clear(req.user);
      return { ok: true, data: cart };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('checkout')
  async checkout(@Req() req: Request, @Body() body: CheckoutCartDto) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const result = await this.cartService.checkout(req.user, body);
      return { ok: true, data: result };
    } catch (error: any) {
      const status = error.message === 'El carrito está vacío.' ? HttpStatus.BAD_REQUEST : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }
}