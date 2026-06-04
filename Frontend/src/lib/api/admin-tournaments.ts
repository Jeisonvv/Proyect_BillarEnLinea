import { patchJson, postFormDataSameOrigin, postJson } from "@/lib/api/client";

export const TOURNAMENT_FORMATS = [
  "SINGLE_ELIMINATION",
  "DOUBLE_ELIMINATION",
  "GROUPS",
  "GROUPS_AND_ELIMINATION",
  "ROUND_ROBIN",
  "SWISS",
] as const;

export const TOURNAMENT_STATUSES = [
  "DRAFT",
  "OPEN",
  "CLOSED",
  "IN_PROGRESS",
  "FINISHED",
  "CANCELLED",
] as const;

export const PLAYER_CATEGORIES = [
  "TERCERA",
  "SEGUNDA",
  "PRIMERA",
  "ELITE",
] as const;

export const REGISTRATION_PLAYER_CATEGORIES = [
  "SIN_DEFINIR",
  "TERCERA",
  "SEGUNDA",
  "PRIMERA",
  "ELITE",
] as const;

export const TOURNAMENT_REGISTRATION_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "WAITLIST",
] as const;

export const PAYMENT_METHODS = [
  "CASH",
  "TRANSFER",
  "CARD",
  "NEQUI",
  "DAVIPLATA",
] as const;

export type TournamentFormat = (typeof TOURNAMENT_FORMATS)[number];
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];
export type PlayerCategory = (typeof PLAYER_CATEGORIES)[number];
export type RegistrationPlayerCategory = (typeof REGISTRATION_PLAYER_CATEGORIES)[number];
export type TournamentRegistrationStatus = (typeof TOURNAMENT_REGISTRATION_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type UpdateTournamentRegistrationStatusInput = {
  status: TournamentRegistrationStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  paidAt?: string;
};

export type UpdateAdminTournamentInput = {
  name?: string;
  description?: string;
  shortDescription?: string;
  formatDetails?: string;
  status?: TournamentStatus;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  discount20Deadline?: string;
  discount10Deadline?: string;
  entryFee?: number;
  maxParticipants?: number;
  venueName?: string;
  location?: string;
  address?: string;
  city?: string;
  country?: string;
  streamUrl?: string;
  imageUrl?: string;
  contactPhone?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  groupStageSlots?: Array<{
    date: string;
    startTime: string;
    endTime?: string;
    label?: string;
  }>;
};

export type UpdateTournamentHandicapInput = {
  handicap: number;
};

export type UpdateTournamentRegistrationPlayerCategoryInput = {
  playerCategory: RegistrationPlayerCategory;
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

export type CreateTournamentInput = {
  name: string;
  description?: string;
  shortDescription?: string;
  formatDetails?: string;
  format: TournamentFormat;
  status: TournamentStatus;
  allowedCategories?: PlayerCategory[];
  startDate: string;
  endDate?: string;
  registrationDeadline: string;
  discount20Deadline?: string;
  discount10Deadline?: string;
  entryFee: number;
  maxParticipants: number;
  prizes?: Array<{
    position: number;
    description: string;
    amount?: number;
  }>;
  venueName?: string;
  location?: string;
  address?: string;
  city?: string;
  country?: string;
  streamUrl?: string;
  imageUrl?: string;
  contactPhone?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  isFeatured?: boolean;
  publishedAt?: string;
  playersPerGroup?: number;
  groupStageTables?: number;
  groupStageSlots?: Array<{
    date: string;
    startTime: string;
    endTime?: string;
    label?: string;
  }>;
  withHandicap?: boolean;
};

export type CreateTournamentResponse = {
  ok: boolean;
  data: {
    _id?: string;
    name?: string;
    slug?: string;
    imageUrl?: string;
    status?: string;
    format?: string;
    createdAt?: string;
  };
};

export type UpdateTournamentRegistrationStatusResponse = {
  ok: boolean;
  message?: string;
  data: {
    _id?: string;
    status?: string;
    paidAt?: string;
    paymentMethod?: string;
    paymentReference?: string;
    user?: {
      _id?: string;
      name?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
      playerCategory?: string | null;
    };
  };
};

export type UpdateAdminTournamentResponse = {
  ok: boolean;
  data: {
    _id?: string;
    slug?: string;
    name?: string;
    description?: string;
    shortDescription?: string;
    formatDetails?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    registrationDeadline?: string;
    discount20Deadline?: string;
    discount10Deadline?: string;
    entryFee?: number;
    maxParticipants?: number;
    venueName?: string;
    location?: string;
    address?: string;
    city?: string;
    country?: string;
    streamUrl?: string;
    imageUrl?: string;
    contactPhone?: string;
    seoTitle?: string;
    seoDescription?: string;
    tags?: string[];
    groupStageSlots?: Array<{
      id: string;
      date: string | null;
      startTime: string | null;
      endTime: string | null;
      label: string | null;
    }>;
  };
};

export type UpdateTournamentHandicapResponse = {
  ok: boolean;
  message?: string;
  data: {
    _id?: string;
    handicap?: number;
    status?: string;
    user?: {
      _id?: string;
      name?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
      playerCategory?: string | null;
    };
  };
};

export type UpdateTournamentRegistrationPlayerCategoryResponse = {
  ok: boolean;
  message?: string;
  data: {
    _id?: string;
    status?: string;
    playerCategory?: string;
    user?: {
      _id?: string;
      name?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
      playerCategory?: string | null;
    };
  };
};

export async function uploadTournamentImage(file: File, name?: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "billar-en-linea/torneos");

  if (name && name.trim().length > 0) {
    formData.append("publicId", name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
  }

  formData.append("tags", "torneos,admin,frontend-lab");

  return postFormDataSameOrigin<UploadImageResponse>("/api/admin/uploads/images", formData, {
    credentials: "include",
  });
}

export async function createTournamentAdmin(input: CreateTournamentInput) {
  return postJson<CreateTournamentResponse, CreateTournamentInput>("/api/tournaments", input, {
    credentials: "include",
  });
}

export async function updateTournamentAdmin(tournamentId: string, input: UpdateAdminTournamentInput) {
  return patchJson<UpdateAdminTournamentResponse, UpdateAdminTournamentInput>(`/api/tournaments/${tournamentId}`, input, {
    credentials: "include",
  });
}

export async function updateTournamentRegistrationStatusAdmin(
  tournamentId: string,
  userId: string,
  input: UpdateTournamentRegistrationStatusInput,
) {
  return patchJson<UpdateTournamentRegistrationStatusResponse, UpdateTournamentRegistrationStatusInput>(
    `/api/tournaments/${tournamentId}/registrations/${userId}/status`,
    input,
    {
      credentials: "include",
    },
  );
}

export async function updateTournamentHandicapAdmin(
  tournamentId: string,
  userId: string,
  input: UpdateTournamentHandicapInput,
) {
  return patchJson<UpdateTournamentHandicapResponse, UpdateTournamentHandicapInput>(
    `/api/tournaments/${tournamentId}/registrations/${userId}/handicap`,
    input,
    {
      credentials: "include",
    },
  );
}

export async function updateTournamentRegistrationPlayerCategoryAdmin(
  tournamentId: string,
  userId: string,
  input: UpdateTournamentRegistrationPlayerCategoryInput,
) {
  return patchJson<
    UpdateTournamentRegistrationPlayerCategoryResponse,
    UpdateTournamentRegistrationPlayerCategoryInput
  >(
    `/api/tournaments/${tournamentId}/registrations/${userId}/player-category`,
    input,
    {
      credentials: "include",
    },
  );
}