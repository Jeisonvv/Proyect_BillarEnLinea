import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { MatchesNestController } from './matches.controller.js';
import { MatchesNestService } from './matches.service.js';

@Module({
  controllers: [MatchesNestController],
  providers: [AuthGuard, RolesGuard, MatchesNestService],
})
export class MatchesModule {}