import { Injectable } from '@nestjs/common';
import {
  ensureLeadSessionService,
  getLeadSessionService,
  promoteLeadSessionService,
  updateLeadSessionDataService,
  upsertLeadSessionStateService,
} from '../../services/lead-session.service.js';
import type {
  EnsureLeadSessionDto,
  UpdateLeadSessionDataDto,
  UpdateLeadSessionStateDto,
} from './dto/lead-sessions.dto.js';

@Injectable()
export class LeadSessionsNestService {
  ensureLeadSession(data: EnsureLeadSessionDto) {
    return ensureLeadSessionService(data);
  }

  getLeadSession(channel: string, providerId: string) {
    return getLeadSessionService(channel, providerId);
  }

  updateLeadSessionState(channel: string, providerId: string, data: UpdateLeadSessionStateDto) {
    return upsertLeadSessionStateService(channel, providerId, data as { currentState: string; stateData?: Record<string, unknown> });
  }

  updateLeadSessionData(channel: string, providerId: string, data: UpdateLeadSessionDataDto) {
    return updateLeadSessionDataService(channel, providerId, data);
  }

  promoteLeadSession(channel: string, providerId: string) {
    return promoteLeadSessionService(channel, providerId);
  }
}