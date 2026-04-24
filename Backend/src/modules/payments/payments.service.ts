import { Injectable } from '@nestjs/common';
import { handleWompiWebhook } from '../../services/payment.service.js';

@Injectable()
export class PaymentsNestService {
  handleWompiWebhook(payload: Record<string, unknown>, eventChecksum: string | string[] | undefined) {
    return handleWompiWebhook(payload, eventChecksum);
  }
}