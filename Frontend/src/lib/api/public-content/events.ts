import { fetchCollection, pickBoolean, pickNumber, pickString, type JsonRecord } from "./shared";
import type { LandingEvent } from "./types";

function normalizeEvent(record: JsonRecord): LandingEvent | null {
  const name = pickString(record, ["name", "title"]);
  const id = pickString(record, ["_id", "id"]);

  if (!name || !id) {
    return null;
  }

  return {
    id,
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

export async function getLandingEvents(limit = 3) {
  return fetchCollection(`/api/events?limit=${limit}`, normalizeEvent);
}

export { normalizeEvent };
export type { LandingEvent };
