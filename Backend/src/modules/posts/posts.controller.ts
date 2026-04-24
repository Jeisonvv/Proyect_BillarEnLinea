import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../models/enums.js';
import type {
  CreatePostDto,
  ListAdminPostsQueryDto,
  ListPostsQueryDto,
  UpdatePostDto,
} from './dto/posts.dto.js';
import { PostsNestService } from './posts.service.js';

@Controller('api/posts')
export class PostsNestController {
  constructor(private readonly postsService: PostsNestService) {}

  @Get()
  async getPosts(@Query() query: ListPostsQueryDto) {
    try {
      const page = Number(query.page ?? '1');
      const limit = Number(query.limit ?? '10');
      const { posts, total } = await this.postsService.listPosts(query);
      return {
        ok: true,
        data: posts,
        pagination: { total, page, limit },
        meta: this.postsService.getMetadata(),
      };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('admin/all')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getAdminPosts(@Query() query: ListAdminPostsQueryDto) {
    try {
      const page = Number(query.page ?? '1');
      const limit = Number(query.limit ?? '20');
      const { posts, total } = await this.postsService.listAdminPosts(query);
      return {
        ok: true,
        data: posts,
        pagination: { total, page, limit },
        meta: this.postsService.getMetadata(),
      };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('id/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getPostById(@Param('id') id: string) {
    try {
      const post = await this.postsService.getPostById(id);
      return { ok: true, data: post, meta: this.postsService.getMetadata() };
    } catch (error: any) {
      const status = error.message === 'Post no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Get(':slug')
  async getPostBySlug(@Param('slug') slug: string) {
    try {
      const post = await this.postsService.getPostBySlug(slug);
      return { ok: true, data: post, meta: this.postsService.getMetadata() };
    } catch (error: any) {
      const status = error.message === 'Post no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createPost(@Req() req: Request, @Body() body: CreatePostDto) {
    if (!req.user?.id) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const post = await this.postsService.createPost(body, req.user.id);
      return { ok: true, data: post, meta: this.postsService.getMetadata() };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updatePost(@Req() req: Request, @Param('id') id: string, @Body() body: UpdatePostDto) {
    if (!req.user?.id) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const post = await this.postsService.updatePost(id, body, req.user.id);
      return { ok: true, data: post, meta: this.postsService.getMetadata() };
    } catch (error: any) {
      const status = error.message === 'Post no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deletePost(@Param('id') id: string) {
    try {
      await this.postsService.deletePost(id);
      return { ok: true, message: 'Post eliminado correctamente.', meta: this.postsService.getMetadata() };
    } catch (error: any) {
      const status = error.message === 'Post no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }
}