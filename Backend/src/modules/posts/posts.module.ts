import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { PostsNestController } from './posts.controller.js';
import { PostsNestService } from './posts.service.js';

@Module({
  controllers: [PostsNestController],
  providers: [AuthGuard, RolesGuard, PostsNestService],
})
export class PostsModule {}