import { fetchCollection, pickNumber, pickString, type JsonRecord } from "./shared";
import type { LandingRaffle } from "./types";

function normalizeRaffle(record: JsonRecord): LandingRaffle | null {
  const name = pickString(record, ["name", "title"]);
  const id = pickString(record, ["_id", "id"]);

  if (!name || !id) {
    return null;
  }

  return {
    id,
    name,
    prize: pickString(record, ["prize"]),
    status: pickString(record, ["status"]),
    drawDate: pickString(record, ["drawDate"]),
    ticketPrice: pickNumber(record, ["ticketPrice"]),
    saleStatus: pickString(record, ["saleStatus"]),
  };
}

export async function getLandingRaffles(limit = 3) {
  return fetchCollection(`/api/raffles?limit=${limit}`, normalizeRaffle);
}

export { normalizeRaffle };
export type { LandingRaffle };
