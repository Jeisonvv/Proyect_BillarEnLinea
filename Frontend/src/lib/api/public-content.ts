// Funciones individuales para obtener cada colección
export async function getLandingTournaments(limit = 3) {
  return fetchCollection(`/api/tournaments?limit=${limit}`, normalizeTournament);
}

export async function getLandingEvents(limit = 3) {
  return fetchCollection(`/api/events?limit=${limit}`, normalizeEvent);
}

export async function getLandingRaffles(limit = 3) {
  return fetchCollection(`/api/raffles?limit=${limit}`, normalizeRaffle);
}

export async function getLandingPosts(limit = 3) {
  return fetchCollection(`/api/posts?limit=${limit}`, normalizePost);
}

export async function getLandingProducts(limit = 3) {
  return fetchCollection(`/api/products?limit=${limit}`, normalizeProduct);
}
import { API_BASE_URL, getJson } from "@/lib/api/client";

type JsonRecord = Record<string, unknown>;

type ApiListResponse = {
  data?: unknown;
  pagination?: {
    total?: unknown;
    page?: unknown;
    limit?: unknown;
  };
  total?: unknown;
};

export type CollectionState<T> = {
  items: T[];
  total: number;
  error: string | null;
};

export type LandingTournament = {
  id: string;
  name: string;
  image: string | null;
  format: string | null;
  status: string | null;
  startDate: string | null;
  entryFee: number | null;
  maxParticipants: number | null;
};

export type LandingEvent = {
  id: string;
  name: string;
  type: string | null;
  tier: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  entryFee: number | null;
  featured: boolean;
};

export type LandingRaffle = {
  id: string;
  name: string;
  prize: string | null;
  status: string | null;
  drawDate: string | null;
  ticketPrice: number | null;
  saleStatus: string | null;
};

export type LandingPost = {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string | null;
  publishedAt: string | null;
  tags: string[];
};

export type LandingProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  basePrice: number | null;
  image: string | null;
  tags: string[];
  stock: number | null;
};

export type LandingSnapshot = {
  tournaments: CollectionState<LandingTournament>;
  events: CollectionState<LandingEvent>;
  raffles: CollectionState<LandingRaffle>;
  posts: CollectionState<LandingPost>;
  products: CollectionState<LandingProduct>;
  totals: {
    tournaments: number;
    events: number;
    raffles: number;
    posts: number;
    products: number;
  };
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function pickString(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function pickNumber(record: JsonRecord, keys: string[]) {
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

function pickBoolean(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

function pickStringArray(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
  }

  return [];
}

function resolveApiAssetUrl(value: string | null) {
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

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "No fue posible cargar el contenido publico.";
}

function normalizeTournament(record: JsonRecord): LandingTournament | null {
  const name = pickString(record, ["name", "title"]);
  const id = pickString(record, ["_id", "id"]);

  if (!name || !id) {
    return null;
  }


  const images = pickStringArray(record, ["images"]);
  const image = pickString(record, ["image", "coverImage", "banner", "poster"]);

  return {
    id,
    name,
    image: resolveApiAssetUrl(images[0] ?? image),
    format: pickString(record, ["format"]),
    status: pickString(record, ["status"]),
    startDate: pickString(record, ["startDate"]),
    entryFee: pickNumber(record, ["entryFee"]),
    maxParticipants: pickNumber(record, ["maxParticipants"]),
  };
}

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

function normalizePost(record: JsonRecord): LandingPost | null {
  const title = pickString(record, ["title", "name"]);
  const id = pickString(record, ["_id", "id"]);

  if (!title || !id) {
    return null;
  }

  return {
    id,
    title,
    excerpt: pickString(record, ["excerpt", "summary"]),
    slug: pickString(record, ["slug"]),
    publishedAt: pickString(record, ["publishedAt", "createdAt", "updatedAt"]),
    tags: pickStringArray(record, ["tags"]),
  };
}

function normalizeProduct(record: JsonRecord): LandingProduct | null {
  const name = pickString(record, ["name", "title"]);
  const id = pickString(record, ["_id", "id"]);

  if (!name || !id) {
    return null;
  }

  const images = pickStringArray(record, ["images"]);

  return {
    id,
    name,
    description: pickString(record, ["description"]),
    category: pickString(record, ["category"]),
    basePrice: pickNumber(record, ["basePrice", "price"]),
    image: resolveApiAssetUrl(images[0] ?? null),
    tags: pickStringArray(record, ["tags"]),
    stock: pickNumber(record, ["stock"]),
  };
}

async function fetchCollection<T>(
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

export async function getLandingSnapshot(): Promise<LandingSnapshot> {
  const [tournaments, events, raffles, posts, products] = await Promise.all([
    fetchCollection("/api/tournaments?limit=3", normalizeTournament),
    fetchCollection("/api/events?limit=3", normalizeEvent),
    fetchCollection("/api/raffles?limit=3", normalizeRaffle),
    fetchCollection("/api/posts?limit=3", normalizePost),
    fetchCollection("/api/products?limit=3", normalizeProduct),
  ]);

  return {
    tournaments,
    events,
    raffles,
    posts,
    products,
    totals: {
      tournaments: tournaments.total,
      events: events.total,
      raffles: raffles.total,
      posts: posts.total,
      products: products.total,
    },
  };
}