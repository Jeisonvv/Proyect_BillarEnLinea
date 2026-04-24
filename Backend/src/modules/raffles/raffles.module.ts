import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RafflesNestController } from './raffles.controller.js';
import { RafflesNestService } from './raffles.service.js';

@Module({
  controllers: [RafflesNestController],
  providers: [AuthGuard, RolesGuard, RafflesNestService],
})
export class RafflesModule {}