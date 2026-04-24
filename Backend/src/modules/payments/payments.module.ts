import { Module } from '@nestjs/common';
import { PaymentsNestController } from './payments.controller.js';
import { PaymentReservationCleanupWorker } from './payment-reservation-cleanup.worker.js';
import { PaymentsNestService } from './payments.service.js';

@Module({
  controllers: [PaymentsNestController],
  providers: [PaymentsNestService, PaymentReservationCleanupWorker],
})
export class PaymentsModule {}