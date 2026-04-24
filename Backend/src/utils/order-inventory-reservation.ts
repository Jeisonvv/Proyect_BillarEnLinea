import { OrderStatus, PaymentTransactionStatus } from "../models/enums.js";

const DEFAULT_ORDER_RESERVATION_MINUTES = Number(process.env.ORDER_CHECKOUT_RESERVATION_MINUTES ?? 30);

export function getOrderInventoryReservationExpiresAt(
  now = new Date(),
  minutes = DEFAULT_ORDER_RESERVATION_MINUTES,
) {
  return new Date(now.getTime() + minutes * 60 * 1000);
}

interface OrderReservationDecisionInput {
  orderStatus: OrderStatus;
  paymentStatus: PaymentTransactionStatus;
  paymentExpiresAt?: Date | null | undefined;
  inventoryReservedUntil?: Date | null | undefined;
  inventoryReleasedAt?: Date | null | undefined;
  now?: Date;
}

export function shouldBlockLateOrderApproval(input: OrderReservationDecisionInput) {
  if (input.paymentStatus !== PaymentTransactionStatus.APPROVED) {
    return false;
  }

  if ([OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(input.orderStatus)) {
    return true;
  }

  if (input.inventoryReleasedAt) {
    return true;
  }

  const now = input.now ?? new Date();
  const nowTime = now.getTime();

  if (input.paymentExpiresAt && input.paymentExpiresAt.getTime() <= nowTime) {
    return true;
  }

  if (input.inventoryReservedUntil && input.inventoryReservedUntil.getTime() <= nowTime) {
    return true;
  }

  return false;
}

export function shouldReleaseOrderInventoryReservation(input: OrderReservationDecisionInput) {
  if (input.inventoryReleasedAt) {
    return false;
  }

  return [
    PaymentTransactionStatus.DECLINED,
    PaymentTransactionStatus.VOIDED,
    PaymentTransactionStatus.ERROR,
    PaymentTransactionStatus.EXPIRED,
  ].includes(input.paymentStatus);
}