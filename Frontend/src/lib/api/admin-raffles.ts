import { deleteJson, getJson, patchJson, postFormData, postJson } from "@/lib/api/client";

export const RAFFLE_STATUSES = ["DRAFT", "ACTIVE", "CLOSED", "DRAWN"] as const;
export type RaffleStatus = (typeof RAFFLE_STATUSES)[number];

export const RAFFLE_NUMBER_STATUSES = ["AVAILABLE", "RESERVED", "PAID", "WINNER"] as const;
export type RaffleNumberStatus = (typeof RAFFLE_NUMBER_STATUSES)[number];

export type CreateRaffleInput = {
  name: string;
  slug?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  prize: string;
  prizeImageUrl?: string;
  ticketPrice: number;
  totalTickets: number;
  drawDate: string;
  imageUrl?: string;
  status?: RaffleStatus;
};

export type UpdateRaffleInput = {
  name?: string;
  slug?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  prize?: string;
  prizeImageUrl?: string;
  imageUrl?: string;
  ticketPrice?: number;
  drawDate?: string;
  status?: RaffleStatus;
};

export type DrawRaffleInput = {
  winningNumber: string;
};

export type RaffleAdminListItem = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  status: RaffleStatus;
  prize: string;
  prizeImageUrl?: string;
  imageUrl?: string;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
  drawDate: string;
  hasWinner?: boolean;
  winnerTicket?: string | null;
  winner?: { _id: string; name: string } | null;
  createdBy?: { _id: string; name: string } | null;
  createdAt?: string;
  updatedAt?: string;
  saleClosesAt?: string | null;
  isFree?: boolean;
};

export type RaffleAdminDetailDto = RaffleAdminListItem & {
  numberSummary?: {
    available: number;
    reserved: number;
    paid: number;
    winner: number;
  };
};

export type RaffleNumberOwner = {
  _id?: string;
  raffle?: string;
  number: string;
  status: RaffleNumberStatus;
  user?: {
    _id?: string;
    name?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  } | null;
  participantName?: string | null;
  participantPhone?: string | null;
  participantIdentityDocument?: string | null;
  reservedAt?: string | null;
  paidAt?: string | null;
};

export type ListRafflesAdminResponse = {
  ok: boolean;
  data: RaffleAdminListItem[];
  pagination?: { total: number; page: number; limit: number };
};

export type RaffleAdminResponse = {
  ok: boolean;
  data: RaffleAdminDetailDto;
};

export type RaffleNumberOwnersResponse = {
  ok: boolean;
  data: {
    numbers: RaffleNumberOwner[];
    total: number;
    page: number;
    limit: number;
  };
};

export type CreateRaffleResponse = {
  ok: boolean;
  data: RaffleAdminListItem & { _id: string };
};

export type UpdateRaffleResponse = {
  ok: boolean;
  data: RaffleAdminDetailDto;
};

export type DrawRaffleResponse = {
  ok: boolean;
  message?: string;
  hasWinner?: boolean;
  data?: RaffleAdminDetailDto;
};

export type DeleteRaffleResponse = {
  ok: boolean;
  message?: string;
  data?: {
    raffleId?: string;
    raffleName?: string;
    deletedNumbers?: number;
    deletedTickets?: number;
    deletedPayments?: number;
    imageDeleted?: boolean;
    prizeImageDeleted?: boolean;
  };
};

export type UploadImageResponse = {
  ok: boolean;
  data: {
    publicId: string;
    url: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
    originalFilename: string;
    folder?: string;
    resourceType?: string;
  };
};

export async function uploadRaffleImage(file: File, name?: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "billar-en-linea/rifas");

  if (name && name.trim().length > 0) {
    formData.append(
      "publicId",
      name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    );
  }

  formData.append("tags", "rifas,admin,frontend-lab");

  return postFormData<UploadImageResponse>("/api/uploads/images", formData, {
    credentials: "include",
  });
}

export async function listRafflesAdmin(params?: { status?: string; page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  return getJson<ListRafflesAdminResponse>(`/api/raffles${qs ? `?${qs}` : ""}`, {
    credentials: "include",
    cache: "no-store",
  });
}

export async function getRaffleByIdAdmin(raffleId: string) {
  return getJson<RaffleAdminResponse>(`/api/raffles/${raffleId}`, {
    credentials: "include",
    cache: "no-store",
  });
}

export async function createRaffleAdmin(input: CreateRaffleInput) {
  return postJson<CreateRaffleResponse, CreateRaffleInput>("/api/raffles", input, {
    credentials: "include",
  });
}

export async function updateRaffleAdmin(raffleId: string, input: UpdateRaffleInput) {
  return patchJson<UpdateRaffleResponse, UpdateRaffleInput>(`/api/raffles/${raffleId}`, input, {
    credentials: "include",
  });
}

export async function drawRaffleAdmin(raffleId: string, input: DrawRaffleInput) {
  return postJson<DrawRaffleResponse, DrawRaffleInput>(`/api/raffles/${raffleId}/draw`, input, {
    credentials: "include",
  });
}

export async function deleteRaffleAdmin(raffleId: string) {
  return deleteJson<DeleteRaffleResponse>(`/api/raffles/${raffleId}`, {
    credentials: "include",
  });
}

export async function getRaffleNumberOwnersAdmin(
  raffleId: string,
  params?: { status?: string; page?: number; limit?: number },
) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  return getJson<RaffleNumberOwnersResponse>(
    `/api/raffles/${raffleId}/number-owners${qs ? `?${qs}` : ""}`,
    { credentials: "include", cache: "no-store" },
  );
}
