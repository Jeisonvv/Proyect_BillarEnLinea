import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UploadsNestController } from './uploads.controller.js';
import { UploadsNestService } from './uploads.service.js';

@Module({
  controllers: [UploadsNestController],
  providers: [AuthGuard, RolesGuard, UploadsNestService],
  exports: [UploadsNestService],
})
export class UploadsModule {}