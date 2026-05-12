import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ActivitiesNestController } from './activities.controller.js';
import { ActivitiesNestService } from './activities.service.js';

@Module({
  controllers: [ActivitiesNestController],
  providers: [AuthGuard, RolesGuard, ActivitiesNestService],
})
export class ActivitiesModule {}