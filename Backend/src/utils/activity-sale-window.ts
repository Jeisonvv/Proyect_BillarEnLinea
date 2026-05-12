export const ACTIVITY_SALES_CLOSE_MINUTES = 40;
export type ActivitySaleStatus = "OPEN" | "CLOSED";

const BOGOTA_TIMEZONE = "America/Bogota";

export class ActivitySalesClosedError extends Error {
  code = "ACTIVITY_SALES_CLOSED";
  status = 400;
  timezone = BOGOTA_TIMEZONE;
  saleClosesAt: string;

  constructor(salesDeadline: Date) {
    super(`La venta de boletos cerró el ${formatBogotaDateTime(salesDeadline)} hora Colombia.`);
    this.name = "ActivitySalesClosedError";
    this.saleClosesAt = salesDeadline.toISOString();
  }
}

type ActivityWithDrawDate = {
  drawDate?: Date | string | null;
};

function formatBogotaDateTime(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: BOGOTA_TIMEZONE,
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function getActivitySalesDeadline(drawDate: Date) {
  return new Date(drawDate.getTime() - ACTIVITY_SALES_CLOSE_MINUTES * 60 * 1000);
}

export function getActivitySaleClosesAt(drawDate?: Date | string | null) {
  if (!drawDate) return undefined;

  const normalizedDrawDate = drawDate instanceof Date ? drawDate : new Date(drawDate);
  if (Number.isNaN(normalizedDrawDate.getTime())) return undefined;

  return getActivitySalesDeadline(normalizedDrawDate).toISOString();
}

export function getActivitySaleStatus(drawDate?: Date | string | null, now = new Date()): ActivitySaleStatus | undefined {
  if (!drawDate) return undefined;

  const normalizedDrawDate = drawDate instanceof Date ? drawDate : new Date(drawDate);
  if (Number.isNaN(normalizedDrawDate.getTime())) return undefined;

  return now.getTime() < getActivitySalesDeadline(normalizedDrawDate).getTime() ? "OPEN" : "CLOSED";
}

export function withActivitySaleClosesAt<T extends ActivityWithDrawDate>(
  activity: T,
  now = new Date(),
): T & { saleClosesAt?: string; saleStatus?: ActivitySaleStatus } {
  const saleClosesAt = getActivitySaleClosesAt(activity.drawDate);
  const saleStatus = getActivitySaleStatus(activity.drawDate, now);

  return {
    ...activity,
    ...(saleClosesAt ? { saleClosesAt } : {}),
    ...(saleStatus ? { saleStatus } : {}),
  };
}

export function hasActivityDrawDate(value: unknown): value is Record<string, unknown> & ActivityWithDrawDate {
  return typeof value === "object" && value !== null && "drawDate" in value;
}

export function isActivitySalesClosedError(error: unknown): error is ActivitySalesClosedError {
  return error instanceof ActivitySalesClosedError;
}

export function assertActivitySalesOpen(drawDate: Date, now = new Date()) {
  const salesDeadline = getActivitySalesDeadline(drawDate);

  if (now.getTime() >= salesDeadline.getTime()) {
    throw new ActivitySalesClosedError(salesDeadline);
  }

  return salesDeadline;
}

export function getActivityReservationExpiration(drawDate: Date, reservationMinutes: number, now = new Date()) {
  const salesDeadline = assertActivitySalesOpen(drawDate, now);
  const defaultExpiration = new Date(now.getTime() + reservationMinutes * 60 * 1000);

  return defaultExpiration.getTime() <= salesDeadline.getTime()
    ? defaultExpiration
    : salesDeadline;
}