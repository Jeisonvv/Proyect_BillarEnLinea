import { Injectable } from '@nestjs/common';
import { getTournamentWompiReturnByReference, handleWompiWebhook } from '../../services/payment.service.js';

@Injectable()
export class PaymentsNestService {
  handleWompiWebhook(payload: Record<string, unknown>, eventChecksum: string | string[] | undefined) {
    return handleWompiWebhook(payload, eventChecksum);
  }

  getTournamentWompiReturn(reference: string) {
    return getTournamentWompiReturnByReference(reference);
  }
}