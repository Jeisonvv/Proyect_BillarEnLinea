import { getJson } from "@/lib/api/client";
import {
  formatError,
  isRecord,
  pickNumber,
  pickRecordArray,
  pickString,
  pickStringArray,
  resolveApiAssetUrl,
  type JsonRecord,
} from "./shared";
import type { LandingTournament, TournamentDetail } from "./types";

function normalizeTournament(record: JsonRecord): LandingTournament | null {
  const name = pickString(record, ["name", "title"]);
  const id = pickString(record, ["_id", "id"]);

  if (!name || !id) {
    return null;
  }

  const images = pickStringArray(record, ["images"]);
  const image = pickString(record, ["image", "imageUrl", "coverImage", "banner", "poster"]);

  return {
    id,
    slug: pickString(record, ["slug"]) ?? id,
    name,
    image: resolveApiAssetUrl(images[0] ?? image),
    format: pickString(record, ["format"]),
    status: pickString(record, ["status"]),
    startDate: pickString(record, ["startDate"]),
    entryFee: pickNumber(record, ["entryFee"]),
    maxParticipants: pickNumber(record, ["maxParticipants"]),
  };
}

function normalizeTournamentDetail(record: JsonRecord): TournamentDetail | null {
  const name = pickString(record, ["name", "title"]);
  const id = pickString(record, ["_id", "id"]);
  const slug = pickString(record, ["slug"]);

  if (!name || !id || !slug) {
    return null;
  }

  const images = pickStringArray(record, ["images"]);
  const image = pickString(record, ["image", "imageUrl", "coverImage", "banner", "poster"]);
  const prizes = pickRecordArray(record, ["prizes"]).map((prize) => ({
    position: pickNumber(prize, ["position"]) ?? 0,
    description: pickString(prize, ["description"]) ?? "Premio por anunciar",
    amount: pickNumber(prize, ["amount"]),
  })).filter((prize) => prize.position > 0);
  const groupStageSlots = pickRecordArray(record, ["groupStageSlots"]).map((slot) => ({
    id: pickString(slot, ["_id", "id"]) ?? "",
    date: pickString(slot, ["date"]),
    startTime: pickString(slot, ["startTime"]),
    endTime: pickString(slot, ["endTime"]),
    label: pickString(slot, ["label"]),
  })).filter((slot) => slot.id.length > 0);
  const registrations = pickRecordArray(record, ["registrations"]).map((registration) => {
    const user = isRecord(registration.user) ? registration.user : null;

    return {
      id: pickString(registration, ["_id", "id"]) ?? `${pickString(user ?? {}, ["_id", "id"]) ?? "inscrito"}-${pickString(registration, ["createdAt"]) ?? "row"}`,
      status: pickString(registration, ["status"]),
      playerCategory: pickString(registration, ["playerCategory"]),
      handicap: pickNumber(registration, ["handicap"]),
      notes: pickString(registration, ["notes"]),
      createdAt: pickString(registration, ["createdAt"]),
      groupStageSlotId: pickString(registration, ["groupStageSlotId"]),
      user: user
        ? {
          id: pickString(user, ["_id", "id"]),
          name: pickString(user, ["name"]),
          phone: pickString(user, ["phone"]),
          avatarUrl: resolveApiAssetUrl(pickString(user, ["avatarUrl"])),
          playerCategory: pickString(user, ["playerCategory"]),
        }
        : null,
    };
  });

  return {
    id,
    slug,
    name,
    image: resolveApiAssetUrl(images[0] ?? image),
    description: pickString(record, ["description"]),
    shortDescription: pickString(record, ["shortDescription"]),
    format: pickString(record, ["format"]),
    formatDetails: pickString(record, ["formatDetails"]),
    status: pickString(record, ["status"]),
    startDate: pickString(record, ["startDate"]),
    endDate: pickString(record, ["endDate"]),
    registrationDeadline: pickString(record, ["registrationDeadline"]),
    entryFee: pickNumber(record, ["entryFee"]),
    maxParticipants: pickNumber(record, ["maxParticipants"]),
    currentParticipants: pickNumber(record, ["currentParticipants"]),
    playersPerGroup: pickNumber(record, ["playersPerGroup"]),
    groupStageTables: pickNumber(record, ["groupStageTables"]),
    venueName: pickString(record, ["venueName"]),
    location: pickString(record, ["location"]),
    address: pickString(record, ["address"]),
    city: pickString(record, ["city"]),
    country: pickString(record, ["country"]),
    streamUrl: pickString(record, ["streamUrl"]),
    contactPhone: pickString(record, ["contactPhone"]),
    tags: pickStringArray(record, ["tags"]),
    allowedCategories: pickStringArray(record, ["allowedCategories"]),
    groupStageSlots,
    totalRegistrations: pickNumber(record, ["totalRegistrations"]),
    confirmedRegistrations: pickNumber(record, ["confirmedRegistrations"]),
    registrations,
    prizes,
  };
}

export async function getLandingTournaments(limit = 3) {
  try {
    const payload = await getJson(`/api/tournaments?limit=${limit}`, {
      cache: "no-store",
    });

    const items = (Array.isArray(payload) ? payload : isRecord(payload) && Array.isArray(payload.data) ? payload.data : [])
      .map((item) => (isRecord(item) ? normalizeTournament(item) : null))
      .filter((item): item is LandingTournament => item !== null);

    const total = isRecord(payload) && isRecord(payload.pagination) && typeof payload.pagination.total === "number"
      ? payload.pagination.total
      : isRecord(payload) && typeof payload.total === "number"
        ? payload.total
        : items.length;

    return { items, total, error: null };
  } catch (error) {
    return { items: [], total: 0, error: formatError(error) };
  }
}

export async function getTournamentDetailBySlug(slug: string) {
  try {
    const payload = await getJson<{ data?: unknown }>(`/api/tournaments/slug/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });

    if (!isRecord(payload) || !isRecord(payload.data)) {
      return null;
    }

    return normalizeTournamentDetail(payload.data);
  } catch {
    return null;
  }
}

export { normalizeTournament, normalizeTournamentDetail };
export type { LandingTournament, TournamentDetail };
