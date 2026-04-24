import { Module } from '@nestjs/common';
import { BotGuard } from '../../common/guards/bot.guard.js';
import { LeadSessionsNestController } from './lead-sessions.controller.js';
import { LeadSessionsNestService } from './lead-sessions.service.js';

@Module({
  controllers: [LeadSessionsNestController],
  providers: [BotGuard, LeadSessionsNestService],
})
export class LeadSessionsModule {}