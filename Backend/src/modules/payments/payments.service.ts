import { Injectable } from '@nestjs/common';
import { getTournamentWompiReturnByReference, getActivityWompiReturnByReference, getOrderWompiReturnByReference, handleWompiWebhook } from '../../services/payment.service.js';

@Injectable()
export class PaymentsNestService {
  handleWompiWebhook(payload: Record<string, unknown>, eventChecksum: string | string[] | undefined) {
    return handleWompiWebhook(payload, eventChecksum);
  }

  getTournamentWompiReturn(reference: string) {
    return getTournamentWompiReturnByReference(reference);
  }

  getActivityWompiReturn(reference: string) {
    return getActivityWompiReturnByReference(reference);
  }

  getOrderWompiReturn(reference: string) {
    return getOrderWompiReturnByReference(reference);
  }
}