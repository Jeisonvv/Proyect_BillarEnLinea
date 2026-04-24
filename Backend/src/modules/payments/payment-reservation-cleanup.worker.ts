import { Injectable } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { cleanupExpiredOrderReservations } from '../../services/order.service.js';
import { cleanupExpiredRaffleReservations } from '../../services/payment.service.js';
import { logError, logInfo } from '../../utils/logger.js';

const DEFAULT_CLEANUP_INTERVAL_MS = 60_000;

export function getReservationCleanupIntervalMs() {
  const rawValue = Number(process.env.PAYMENT_RESERVATION_CLEANUP_INTERVAL_MS ?? DEFAULT_CLEANUP_INTERVAL_MS);

  if (!Number.isFinite(rawValue) || rawValue < 5_000) {
    return DEFAULT_CLEANUP_INTERVAL_MS;
  }

  return Math.floor(rawValue);
}

function isReservationCleanupEnabled() {
  return (process.env.PAYMENT_RESERVATION_CLEANUP_ENABLED ?? 'true').trim().toLowerCase() !== 'false';
}

@Injectable()
export class PaymentReservationCleanupWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private running = false;

  onModuleInit() {
    if (!isReservationCleanupEnabled()) {
      logInfo('payment_reservation_cleanup_disabled');
      return;
    }

    const intervalMs = getReservationCleanupIntervalMs();

    this.timer = setInterval(() => {
      void this.runCleanup('interval');
    }, intervalMs);

    this.timer.unref?.();

    logInfo('payment_reservation_cleanup_started', { intervalMs });
    void this.runCleanup('startup');
  }

  onModuleDestroy() {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    delete this.timer;
    logInfo('payment_reservation_cleanup_stopped');
  }

  private async runCleanup(trigger: 'startup' | 'interval') {
    if (this.running) {
      return;
    }

    this.running = true;
    const startedAt = Date.now();

    try {
      const [expiredRaffleReservations, expiredOrderReservations] = await Promise.all([
        cleanupExpiredRaffleReservations(),
        cleanupExpiredOrderReservations(),
      ]);

      logInfo('payment_reservation_cleanup_completed', {
        trigger,
        expiredRaffleReservations,
        expiredOrderReservations,
        durationMs: Date.now() - startedAt,
      });
    } catch (error: any) {
      logError('payment_reservation_cleanup_failed', {
        trigger,
        durationMs: Date.now() - startedAt,
        message: error?.message ?? 'Error desconocido durante cleanup de reservas.',
      });
    } finally {
      this.running = false;
    }
  }
}