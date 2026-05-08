import { getJson } from "@/lib/api/client";
import { fetchCollection, isRecord, pickBoolean, pickNumber, pickRecordArray, pickString, resolveApiAssetUrl, type JsonRecord } from "./shared";
import type { EventDetail, LandingEvent } from "./types";

function normalizeEvent(record: JsonRecord): LandingEvent | null {
  const name = pickString(record, ["name", "title"]);
  const id = pickString(record, ["_id", "id"]);

  if (!name || !id) {
    return null;
  }

  return {
    id,
    slug: pickString(record, ["slug"]) ?? id,
    name,
    type: pickString(record, ["type"]),
    tier: pickString(record, ["tier"]),
    status: pickString(record, ["status"]),
    startDate: pickString(record, ["startDate"]),
    endDate: pickString(record, ["endDate"]),
    entryFee: pickNumber(record, ["entryFee", "ticketPrice"]),
    featured: pickBoolean(record, ["featured"]) ?? false,
  };
}

function normalizeEventDetail(record: JsonRecord): EventDetail | null {
  const base = normalizeEvent(record);

  if (!base) {
    return null;
  }

  return {
    ...base,
    description: pickString(record, ["description"]),
    organizer: pickString(record, ["organizer"]),
    location: pickString(record, ["location"]),
    city: pickString(record, ["city"]),
    department: pickString(record, ["department"]),
    country: pickString(record, ["country"]),
    registrationMode: pickString(record, ["registrationMode"]),
    image: resolveApiAssetUrl(pickString(record, ["imageUrl"])),
    streamUrl: pickString(record, ["streamUrl"]),
    registrationUrl: pickString(record, ["registrationUrl"]),
    hasGrandstand: pickBoolean(record, ["hasGrandstand"]) ?? false,
    grandstandDetails: pickString(record, ["grandstandDetails"]),
    ticketingMode: pickString(record, ["ticketingMode"]),
    ticketPrice: pickNumber(record, ["ticketPrice"]),
    ticketUrl: pickString(record, ["ticketUrl"]),
    resultsUrl: pickString(record, ["resultsUrl"]),
    seoTitle: pickString(record, ["seoTitle"]),
    seoDescription: pickString(record, ["seoDescription"]),
    prizes: pickRecordArray(record, ["prizes"]).map((prize) => ({
      position: pickNumber(prize, ["position"]) ?? 0,
      description: pickString(prize, ["description"]) ?? "Premio por anunciar",
      amount: pickNumber(prize, ["amount"]),
    })),
  };
}

export async function getLandingEvents(limit = 3) {
  return fetchCollection(`/api/events?limit=${limit}`, normalizeEvent);
}

export async function getEventDetailBySlug(slug: string) {
  try {
    const payload = await getJson<{ data?: unknown }>(`/api/events/slug/${encodeURIComponent(slug)}`, {
      cache: "force-cache",
      next: { revalidate: 300 },
    } as RequestInit);

    if (!isRecord(payload) || !isRecord(payload.data)) {
      return null;
    }

    return normalizeEventDetail(payload.data);
  } catch {
    return null;
  }
}

export { normalizeEvent, normalizeEventDetail };
export type { EventDetail, LandingEvent };
