import { postFormData, postJson } from "@/lib/api/client";

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

export type TournamentFormat = (typeof TOURNAMENT_FORMATS)[number];
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];
export type PlayerCategory = (typeof PLAYER_CATEGORIES)[number];

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

export async function uploadTournamentImage(file: File, name?: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "billar-en-linea/torneos");

  if (name && name.trim().length > 0) {
    formData.append("publicId", name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
  }

  formData.append("tags", "torneos,admin,frontend-lab");

  return postFormData<UploadImageResponse>("/api/uploads/images", formData, {
    credentials: "include",
  });
}

export async function createTournamentAdmin(input: CreateTournamentInput) {
  return postJson<CreateTournamentResponse, CreateTournamentInput>("/api/tournaments", input, {
    credentials: "include",
  });
}