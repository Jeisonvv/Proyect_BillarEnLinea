import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCategory } from '../../../models/enums.js';

export class ProductVariantDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsString()
	@IsNotEmpty()
	sku!: string;

	@IsNumber()
	@Min(0)
	price!: number;

	@IsInt()
	@Min(0)
	stock!: number;

	@IsOptional()
	@IsString()
	imageUrl?: string;
}

export class CreateProductDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsIn(Object.values(ProductCategory))
	category!: string;

	@IsNumber()
	@Min(0)
	basePrice!: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	stock?: number;

	@IsOptional()
	@IsArray()
	images?: string[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ProductVariantDto)
	variants?: ProductVariantDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsArray()
	tags?: string[];

	[key: string]: unknown;
}

export class UpdateProductDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsIn(Object.values(ProductCategory))
	category?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	basePrice?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	stock?: number;

	@IsOptional()
	@IsArray()
	images?: string[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ProductVariantDto)
	variants?: ProductVariantDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsArray()
	tags?: string[];

	[key: string]: unknown;
}

export class ListProductsQueryDto {
	@IsOptional()
	@IsString()
	category?: string;

	@IsOptional()
	@IsString()
	tag?: string;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	page?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	limit?: number;
}

export class ListAdminProductsQueryDto extends ListProductsQueryDto {
	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}