import { Injectable } from '@nestjs/common';
import {
  createProductService,
  deleteProductService,
  getProductByIdService,
  listAdminProductsService,
  listProductsService,
  updateProductService,
} from '../../services/product.service.js';
import type {
  CreateProductDto,
  ListAdminProductsQueryDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from './dto/products.dto.js';

@Injectable()
export class ProductsNestService {
  createProduct(data: CreateProductDto) {
    return createProductService(data);
  }

  listProducts(query: ListProductsQueryDto) {
    return listProductsService({
      ...(typeof query.category === 'string' && { category: query.category }),
      ...(typeof query.tag === 'string' && { tag: query.tag }),
      ...(typeof query.search === 'string' && { search: query.search }),
      page: Number(query.page ?? '1'),
      limit: Number(query.limit ?? '20'),
    });
  }

  listAdminProducts(query: ListAdminProductsQueryDto) {
    return listAdminProductsService({
      ...(typeof query.category === 'string' && { category: query.category }),
      ...(typeof query.tag === 'string' && { tag: query.tag }),
      ...(typeof query.search === 'string' && { search: query.search }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      page: Number(query.page ?? '1'),
      limit: Number(query.limit ?? '20'),
    });
  }

  getProductById(id: string) {
    return getProductByIdService(id);
  }

  updateProduct(id: string, data: UpdateProductDto) {
    return updateProductService(id, data);
  }

  deleteProduct(id: string) {
    return deleteProductService(id);
  }
}