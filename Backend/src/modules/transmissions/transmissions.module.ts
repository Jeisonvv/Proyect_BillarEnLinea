import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { TransmissionsNestController } from './transmissions.controller.js';
import { TransmissionsNestService } from './transmissions.service.js';

@Module({
  controllers: [TransmissionsNestController],
  providers: [AuthGuard, RolesGuard, TransmissionsNestService],
})
export class TransmissionsModule {}