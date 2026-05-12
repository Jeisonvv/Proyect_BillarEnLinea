export const RAFFLE_SALES_CLOSE_MINUTES = 40;
export type RaffleSaleStatus = "OPEN" | "CLOSED";

const BOGOTA_TIMEZONE = "America/Bogota";

export class RaffleSalesClosedError extends Error {
  code = "RAFFLE_SALES_CLOSED";
  status = 400;
  timezone = BOGOTA_TIMEZONE;
  saleClosesAt: string;

  constructor(salesDeadline: Date) {
    super(`La venta de boletos cerró el ${formatBogotaDateTime(salesDeadline)} hora Colombia.`);
    this.name = "RaffleSalesClosedError";
    this.saleClosesAt = salesDeadline.toISOString();
  }
}

type RaffleWithDrawDate = {
  drawDate?: Date | string | null;
};

function formatBogotaDateTime(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: BOGOTA_TIMEZONE,
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function getRaffleSalesDeadline(drawDate: Date) {
  return new Date(drawDate.getTime() - RAFFLE_SALES_CLOSE_MINUTES * 60 * 1000);
}

export function getRaffleSaleClosesAt(drawDate?: Date | string | null) {
  if (!drawDate) return undefined;

  const normalizedDrawDate = drawDate instanceof Date ? drawDate : new Date(drawDate);
  if (Number.isNaN(normalizedDrawDate.getTime())) return undefined;

  return getRaffleSalesDeadline(normalizedDrawDate).toISOString();
}

export function getRaffleSaleStatus(drawDate?: Date | string | null, now = new Date()): RaffleSaleStatus | undefined {
  if (!drawDate) return undefined;

  const normalizedDrawDate = drawDate instanceof Date ? drawDate : new Date(drawDate);
  if (Number.isNaN(normalizedDrawDate.getTime())) return undefined;

  return now.getTime() < getRaffleSalesDeadline(normalizedDrawDate).getTime() ? "OPEN" : "CLOSED";
}

export function withRaffleSaleClosesAt<T extends RaffleWithDrawDate>(
  raffle: T,
  now = new Date(),
): T & { saleClosesAt?: string; saleStatus?: RaffleSaleStatus } {
  const saleClosesAt = getRaffleSaleClosesAt(raffle.drawDate);
  const saleStatus = getRaffleSaleStatus(raffle.drawDate, now);

  return {
    ...raffle,
    ...(saleClosesAt ? { saleClosesAt } : {}),
    ...(saleStatus ? { saleStatus } : {}),
  };
}

export function hasRaffleDrawDate(value: unknown): value is Record<string, unknown> & RaffleWithDrawDate {
  return typeof value === "object" && value !== null && "drawDate" in value;
}

export function isRaffleSalesClosedError(error: unknown): error is RaffleSalesClosedError {
  return error instanceof RaffleSalesClosedError;
}

export function assertRaffleSalesOpen(drawDate: Date, now = new Date()) {
  const salesDeadline = getRaffleSalesDeadline(drawDate);

  if (now.getTime() >= salesDeadline.getTime()) {
    throw new RaffleSalesClosedError(salesDeadline);
  }

  return salesDeadline;
}

export function getRaffleReservationExpiration(drawDate: Date, reservationMinutes: number, now = new Date()) {
  const salesDeadline = assertRaffleSalesOpen(drawDate, now);
  const defaultExpiration = new Date(now.getTime() + reservationMinutes * 60 * 1000);

  return defaultExpiration.getTime() <= salesDeadline.getTime()
    ? defaultExpiration
    : salesDeadline;
}