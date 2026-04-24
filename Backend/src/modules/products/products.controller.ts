import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../models/enums.js';
import type {
  CreateProductDto,
  ListAdminProductsQueryDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from './dto/products.dto.js';
import { ProductsNestService } from './products.service.js';

@Controller('api/products')
export class ProductsNestController {
  constructor(private readonly productsService: ProductsNestService) {}

  @Get()
  async getProducts(@Query() query: ListProductsQueryDto) {
    try {
      const page = Number(query.page ?? '1');
      const limit = Number(query.limit ?? '20');
      const { products, total } = await this.productsService.listProducts(query);
      return { ok: true, data: products, pagination: { total, page, limit } };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('admin/all')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getAdminProducts(@Query() query: ListAdminProductsQueryDto) {
    try {
      const page = Number(query.page ?? '1');
      const limit = Number(query.limit ?? '20');
      const { products, total } = await this.productsService.listAdminProducts(query);
      return { ok: true, data: products, pagination: { total, page, limit } };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    try {
      const product = await this.productsService.getProductById(id);
      return { ok: true, data: product };
    } catch (error: any) {
      const status = error.message === 'Producto no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createProduct(@Body() body: CreateProductDto) {
    try {
      const product = await this.productsService.createProduct(body);
      return { ok: true, data: product };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateProduct(@Param('id') id: string, @Body() body: UpdateProductDto) {
    try {
      const product = await this.productsService.updateProduct(id, body);
      return { ok: true, data: product };
    } catch (error: any) {
      const status = error.message === 'Producto no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteProduct(@Param('id') id: string) {
    try {
      await this.productsService.deleteProduct(id);
      return { ok: true, message: 'Producto ocultado correctamente.' };
    } catch (error: any) {
      const status = error.message === 'Producto no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }
}