/**
 * Utilidades compartidas entre componentes admin (labs, detalles, etc.).
 *
 * Mantén aquí helpers genéricos del panel de administración.
 * Para utilidades de presentación pública (landing/usuarios), usa
 * `components/content/user/shared/utils.ts`.
 */

/**
 * Convierte el valor de un input <input type="datetime-local"> a un ISO string.
 * Devuelve undefined si el valor está vacío o es inválido (compatible con
 * payloads opcionales tipo `field?: string`).
 */
export function toIsoDate(value: string): string | undefined {
  if (!value) return undefined;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

/**
 * Convierte un ISO/Date al formato `YYYY-MM-DDTHH:mm` esperado por
 * <input type="datetime-local">, usando la zona local del navegador.
 */
export function toDateTimeLocalValue(value: string | Date | null | undefined): string {
  if (!value) return "";

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(
    parsed.getHours(),
  )}:${pad(parsed.getMinutes())}`;
}

/**
 * Extrae un mensaje legible para el usuario a partir de un error desconocido.
 * Útil para feedback de mutaciones (POST/PUT/DELETE) en componentes admin.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "No fue posible completar la operación.",
): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

/**
 * Parsea un input de tags separadas por coma a un array limpio (sin vacíos).
 * Devuelve `undefined` cuando no hay tags válidas para que sea seguro spread
 * en payloads `Partial<...>` con `exactOptionalPropertyTypes`.
 */
export function parseTagsInput(value: string | null | undefined): string[] | undefined {
  if (typeof value !== "string") return undefined;

  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return tags.length > 0 ? tags : undefined;
}
