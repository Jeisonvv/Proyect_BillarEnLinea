import { Module } from '@nestjs/common';
import { TournamentsNestController } from './tournaments.controller.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { TournamentsNestService } from './tournaments.service.js';

@Module({
  controllers: [TournamentsNestController],
  providers: [AuthGuard, RolesGuard, TournamentsNestService],
})
export class TournamentsModule {}