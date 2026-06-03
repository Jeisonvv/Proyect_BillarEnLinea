import { deleteJson, getJson, patchJson, postFormData, postJson } from "@/lib/api/client";

export const ACTIVITY_STATUSES = ["DRAFT", "ACTIVE", "CLOSED", "DRAWN"] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export const ACTIVITY_NUMBER_STATUSES = ["AVAILABLE", "RESERVED", "PAID", "WINNER"] as const;
export type ActivityNumberStatus = (typeof ACTIVITY_NUMBER_STATUSES)[number];

export type CreateActivityInput = {
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
  status?: ActivityStatus;
  promoVideoUrl?: string;
};

export type UpdateActivityInput = {
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
  status?: ActivityStatus;
};

export type DrawActivityInput = {
  winningNumber: string;
};

export type ActivityAdminListItem = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  status: ActivityStatus;
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

export type ActivityAdminDetailDto = ActivityAdminListItem & {
  numberSummary?: {
    available: number;
    reserved: number;
    paid: number;
    winner: number;
  };
};

export type ActivityNumberOwner = {
  _id?: string;
  activity?: string;
  number: string;
  status: ActivityNumberStatus;
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

export type ListActivitiesAdminResponse = {
  ok: boolean;
  data: ActivityAdminListItem[];
  pagination?: { total: number; page: number; limit: number };
};

export type ActivityAdminResponse = {
  ok: boolean;
  data: ActivityAdminDetailDto;
};

export type ActivityNumberOwnersResponse = {
  ok: boolean;
  data: {
    numbers: ActivityNumberOwner[];
    total: number;
    page: number;
    limit: number;
  };
};

export type CreateActivityResponse = {
  ok: boolean;
  data: ActivityAdminListItem & { _id: string };
};

export type UpdateActivityResponse = {
  ok: boolean;
  data: ActivityAdminDetailDto;
};

export type DrawActivityResponse = {
  ok: boolean;
  message?: string;
  hasWinner?: boolean;
  data?: ActivityAdminDetailDto;
};

export type DeleteActivityResponse = {
  ok: boolean;
  message?: string;
  data?: {
    activityId?: string;
    activityName?: string;
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

function isNetworkFetchError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /failed to fetch|networkerror|load failed/i.test(error.message);
}

function buildPublicId(name?: string) {
  if (!name || name.trim().length === 0) return undefined;
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uploadWithPayload(
  file: File,
  options?: { folder?: string; publicId?: string; tags?: string },
) {
  const formData = new FormData();
  formData.append("file", file);

  if (options?.folder) formData.append("folder", options.folder);
  if (options?.publicId) formData.append("publicId", options.publicId);
  if (options?.tags) formData.append("tags", options.tags);

  return postFormData<UploadImageResponse>("/api/uploads/images", formData, {
    credentials: "include",
  });
}

export async function uploadActivityImage(file: File, name?: string) {
  const publicId = buildPublicId(name);

  try {
    // Perfil primario para actividades.
    return await uploadWithPayload(file, {
      folder: "billar-en-linea/actividades",
      publicId,
      tags: "actividades,admin,frontend-lab",
    });
  } catch (error) {
    if (!isNetworkFetchError(error)) {
      throw error;
    }

    try {
      // Compatibilidad: replica exactamente el perfil que funciona en torneos.
      return await uploadWithPayload(file, {
        folder: "billar-en-linea/torneos",
        publicId,
        tags: "torneos,admin,frontend-lab",
      });
    } catch (fallbackError) {
      if (!isNetworkFetchError(fallbackError)) {
        throw fallbackError;
      }

      // Ultimo recurso: solo archivo.
      return uploadWithPayload(file);
    }
  }
}

export async function listActivitiesAdmin(params?: { status?: string; page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  return getJson<ListActivitiesAdminResponse>(`/api/activities${qs ? `?${qs}` : ""}`, {
    credentials: "include",
    cache: "no-store",
  });
}

export async function getActivityByIdAdmin(activityId: string) {
  return getJson<ActivityAdminResponse>(`/api/activities/${activityId}`, {
    credentials: "include",
    cache: "no-store",
  });
}

export async function createActivityAdmin(input: CreateActivityInput) {
  return postJson<CreateActivityResponse, CreateActivityInput>("/api/activities", input, {
    credentials: "include",
  });
}

export async function updateActivityAdmin(activityId: string, input: UpdateActivityInput) {
  return patchJson<UpdateActivityResponse, UpdateActivityInput>(`/api/activities/${activityId}`, input, {
    credentials: "include",
  });
}

export async function drawActivityAdmin(activityId: string, input: DrawActivityInput) {
  return postJson<DrawActivityResponse, DrawActivityInput>(`/api/activities/${activityId}/draw`, input, {
    credentials: "include",
  });
}

export async function deleteActivityAdmin(activityId: string) {
  return deleteJson<DeleteActivityResponse>(`/api/activities/${activityId}`, {
    credentials: "include",
  });
}

export async function getActivityNumberOwnersAdmin(
  activityId: string,
  params?: { status?: string; page?: number; limit?: number },
) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  return getJson<ActivityNumberOwnersResponse>(
    `/api/activities/${activityId}/number-owners${qs ? `?${qs}` : ""}`,
    { credentials: "include", cache: "no-store" },
  );
}
