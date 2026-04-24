import { OrderStatus, PaymentTransactionStatus } from "../models/enums.js";

export type OrderPaymentTransition = "mark-paid" | "keep-pending" | "ignore" | "blocked";

export function resolveOrderPaymentTransition(
  currentOrderStatus: OrderStatus,
  paymentStatus: PaymentTransactionStatus,
): OrderPaymentTransition {
  if (paymentStatus === PaymentTransactionStatus.APPROVED) {
    if ([OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(currentOrderStatus)) {
      return "ignore";
    }

    if ([OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(currentOrderStatus)) {
      return "blocked";
    }

    return "mark-paid";
  }

  if ([
    PaymentTransactionStatus.DECLINED,
    PaymentTransactionStatus.VOIDED,
    PaymentTransactionStatus.ERROR,
    PaymentTransactionStatus.EXPIRED,
  ].includes(paymentStatus)) {
    if ([OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(currentOrderStatus)) {
      return "ignore";
    }

    if ([OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(currentOrderStatus)) {
      return "ignore";
    }

    return "keep-pending";
  }

  return "ignore";
}