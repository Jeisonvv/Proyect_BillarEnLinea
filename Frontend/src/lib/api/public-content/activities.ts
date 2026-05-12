import { getJson } from "@/lib/api/client";
import {
  fetchCollection,
  formatError,
  isRecord,
  pickNumber,
  pickString,
  pickStringArray,
  resolveApiAssetUrl,
  type JsonRecord,
} from "./shared";
import type { LandingActivity, ActivityDetail } from "./types";

function pickBoolean(record: JsonRecord, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return null;
}

function normalizeActivity(record: JsonRecord): LandingActivity | null {
  const name = pickString(record, ["name", "title"]);
  const id = pickString(record, ["_id", "id"]);

  if (!name || !id) {
    return null;
  }

  return {
    id,
    name,
    slug: pickString(record, ["slug"]),
    prize: pickString(record, ["prize"]),
    status: pickString(record, ["status"]),
    drawDate: pickString(record, ["drawDate"]),
    ticketPrice: pickNumber(record, ["ticketPrice"]),
    saleStatus: pickString(record, ["saleStatus"]),
    image: resolveApiAssetUrl(pickString(record, ["imageUrl", "image"])),
    prizeImage: resolveApiAssetUrl(pickString(record, ["prizeImageUrl", "prizeImage"])),
    totalTickets: pickNumber(record, ["totalTickets"]),
    soldTickets: pickNumber(record, ["soldTickets"]),
    saleClosesAt: pickString(record, ["saleClosesAt"]),
    isFree: pickBoolean(record, ["isFree"]),
  };
}

function normalizeActivityDetail(record: JsonRecord): ActivityDetail | null {
  const base = normalizeActivity(record);
  if (!base) return null;

  const winnerRecord = isRecord(record.winner) ? record.winner : null;
  const summaryRecord = isRecord(record.numberSummary) ? record.numberSummary : null;

  return {
    ...base,
    description: pickString(record, ["description"]),
    seoTitle: pickString(record, ["seoTitle"]),
    seoDescription: pickString(record, ["seoDescription"]),
    tags: pickStringArray(record, ["tags"]) ?? [],
    hasWinner: pickBoolean(record, ["hasWinner"]) ?? false,
    winnerTicket: pickString(record, ["winnerTicket"]),
    winnerName: winnerRecord ? pickString(winnerRecord, ["name"]) : null,
    numberSummary: summaryRecord
      ? {
        available: pickNumber(summaryRecord, ["available"]) ?? 0,
        reserved: pickNumber(summaryRecord, ["reserved"]) ?? 0,
        paid: pickNumber(summaryRecord, ["paid"]) ?? 0,
        winner: pickNumber(summaryRecord, ["winner"]) ?? 0,
      }
      : null,
  };
}

export async function getLandingActivities(limit = 3) {
  // no-store: las rifas cambian con frecuencia (creación, cambios de estado,
  // sorteos) y necesitamos ver lo más reciente sin esperar a que expire el
  // revalidate por defecto.
  return fetchCollection(`/api/activities?limit=${limit}`, normalizeActivity, {
    cache: "no-store",
  });
}

export async function getActivityDetailById(id: string) {
  try {
    const payload = await getJson<{ data?: unknown }>(`/api/activities/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });

    if (!isRecord(payload) || !isRecord(payload.data)) {
      return null;
    }

    return normalizeActivityDetail(payload.data);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("getActivityDetailById error", formatError(error));
    }
    return null;
  }
}

export type ActivityNumberItem = {
  number: string;
  numericValue: number;
  status: "AVAILABLE" | "RESERVED" | "PAID" | "WINNER";
};

export type ActivityNumbersResponse = {
  numbers: ActivityNumberItem[];
  totalTickets: number | null;
  saleStatus: string | null;
  saleClosesAt: string | null;
};

export async function getActivityNumbers(id: string, limit = 1000): Promise<ActivityNumbersResponse | null> {
  try {
    const payload = await getJson<{ data?: unknown }>(
      `/api/activities/${encodeURIComponent(id)}/numbers?limit=${limit}`,
      { cache: "no-store" },
    );

    if (!isRecord(payload) || !isRecord(payload.data)) {
      return null;
    }

    const data = payload.data;
    const rawNumbers = Array.isArray(data.numbers) ? data.numbers : [];
    const numbers: ActivityNumberItem[] = [];

    for (const item of rawNumbers) {
      if (!isRecord(item)) continue;
      const number = pickString(item, ["number"]);
      const numericValue = pickNumber(item, ["numericValue"]);
      const status = pickString(item, ["status"]);
      if (!number || numericValue === null || !status) continue;
      if (status !== "AVAILABLE" && status !== "RESERVED" && status !== "PAID" && status !== "WINNER") continue;
      numbers.push({ number, numericValue, status });
    }

    return {
      numbers,
      totalTickets: pickNumber(data, ["totalTickets"]),
      saleStatus: pickString(data, ["saleStatus"]),
      saleClosesAt: pickString(data, ["saleClosesAt"]),
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("getActivityNumbers error", formatError(error));
    }
    return null;
  }
}

export { normalizeActivity, normalizeActivityDetail };
export type { LandingActivity, ActivityDetail };

export type MyActivityNumber = {
  number: string;
  numericValue: number;
  status: "RESERVED" | "PAID" | "WINNER";
};

export async function getMyActivityNumbers(id: string): Promise<MyActivityNumber[]> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const authNames = ["billar_auth", "auth_token"];
    const cookieHeader = authNames
      .map((name) => {
        const value = cookieStore.get(name)?.value;
        return value ? `${name}=${value}` : null;
      })
      .filter((entry): entry is string => entry !== null)
      .join("; ");

    if (!cookieHeader) return [];

    const payload = await getJson<{ data?: unknown }>(
      `/api/activities/${encodeURIComponent(id)}/my-numbers`,
      { cache: "no-store", headers: { Cookie: cookieHeader } },
    );

    if (!isRecord(payload) || !isRecord(payload.data)) return [];
    const rawNumbers = Array.isArray(payload.data.numbers) ? payload.data.numbers : [];
    const result: MyActivityNumber[] = [];

    for (const item of rawNumbers) {
      if (!isRecord(item)) continue;
      const number = pickString(item, ["number"]);
      const numericValue = pickNumber(item, ["numericValue"]);
      const status = pickString(item, ["status"]);
      if (!number || numericValue === null || !status) continue;
      if (status !== "RESERVED" && status !== "PAID" && status !== "WINNER") continue;
      result.push({ number, numericValue, status });
    }

    return result;
  } catch {
    return [];
  }
}
