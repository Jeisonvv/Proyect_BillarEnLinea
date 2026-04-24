import { Injectable } from '@nestjs/common';
import {
  createPostService,
  deletePostService,
  getPostByIdService,
  getPostBySlugService,
  getPostSiteMetadata,
  listAdminPostsService,
  listPostsService,
  updatePostService,
} from '../../services/post.service.js';
import type {
  CreatePostDto,
  ListAdminPostsQueryDto,
  ListPostsQueryDto,
  UpdatePostDto,
} from './dto/posts.dto.js';

@Injectable()
export class PostsNestService {
  createPost(data: CreatePostDto, creatorId: string) {
    return createPostService(data, creatorId);
  }

  listPosts(query: ListPostsQueryDto) {
    return listPostsService({
      ...(typeof query.category === 'string' && { category: query.category }),
      ...(typeof query.tag === 'string' && { tag: query.tag }),
      ...(typeof query.search === 'string' && { search: query.search }),
      page: Number(query.page ?? '1'),
      limit: Number(query.limit ?? '10'),
    });
  }

  listAdminPosts(query: ListAdminPostsQueryDto) {
    return listAdminPostsService({
      ...(typeof query.status === 'string' && { status: query.status }),
      ...(typeof query.category === 'string' && { category: query.category }),
      ...(typeof query.tag === 'string' && { tag: query.tag }),
      ...(typeof query.search === 'string' && { search: query.search }),
      page: Number(query.page ?? '1'),
      limit: Number(query.limit ?? '20'),
    });
  }

  getPostBySlug(slug: string) {
    return getPostBySlugService(slug);
  }

  getPostById(id: string) {
    return getPostByIdService(id);
  }

  updatePost(id: string, data: UpdatePostDto, editorId: string) {
    return updatePostService(id, data, editorId);
  }

  deletePost(id: string) {
    return deletePostService(id);
  }

  getMetadata() {
    return getPostSiteMetadata();
  }
}