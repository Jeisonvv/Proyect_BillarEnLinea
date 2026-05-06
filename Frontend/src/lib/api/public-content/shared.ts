import { API_BASE_URL, getJson } from "@/lib/api/client";
import type { CollectionState } from "./types";

export type JsonRecord = Record<string, unknown>;

type ApiListResponse = {
  data?: unknown;
  pagination?: {
    total?: unknown;
    page?: unknown;
    limit?: unknown;
  };
  total?: unknown;
};

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

export function pickString(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

export function pickNumber(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

export function pickBoolean(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

export function pickStringArray(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
  }

  return [];
}

export function pickRecordArray(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }

  return [];
}

export function resolveApiAssetUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, API_BASE_URL).toString();
  } catch {
    return value;
  }
}

function getItems(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

function getTotal(payload: unknown, fallback: number) {
  if (!isRecord(payload)) {
    return fallback;
  }

  const pagination = payload.pagination;
  if (isRecord(pagination)) {
    const total = pagination.total;
    if (typeof total === "number" && Number.isFinite(total)) {
      return total;
    }
  }

  if (typeof payload.total === "number" && Number.isFinite(payload.total)) {
    return payload.total;
  }

  return fallback;
}

export function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "No fue posible cargar el contenido publico.";
}

export async function fetchCollection<T>(
  path: string,
  mapper: (record: JsonRecord) => T | null,
): Promise<CollectionState<T>> {
  try {
    const payload = await getJson<ApiListResponse>(path, {
      cache: "force-cache",
      next: { revalidate: 300 },
    } as RequestInit);

    const items = getItems(payload)
      .map((item) => (isRecord(item) ? mapper(item) : null))
      .filter((item): item is T => item !== null);

    return {
      items,
      total: getTotal(payload, items.length),
      error: null,
    };
  } catch (error) {
    return {
      items: [],
      total: 0,
      error: formatError(error),
    };
  }
}
