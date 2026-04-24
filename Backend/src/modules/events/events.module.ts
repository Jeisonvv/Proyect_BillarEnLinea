import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { EventsNestController } from './events.controller.js';
import { EventsNestService } from './events.service.js';

@Module({
  controllers: [EventsNestController],
  providers: [AuthGuard, RolesGuard, EventsNestService],
})
export class EventsModule {}