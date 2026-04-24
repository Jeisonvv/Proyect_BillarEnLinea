import { Module } from '@nestjs/common';
import { UsersNestController } from './users.controller.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { BotGuard } from '../../common/guards/bot.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UsersNestService } from './users.service.js';

@Module({
  controllers: [UsersNestController],
  providers: [AuthGuard, BotGuard, RolesGuard, UsersNestService],
})
export class UsersModule {}