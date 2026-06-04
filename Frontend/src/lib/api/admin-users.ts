import { getJson, patchJson } from "@/lib/api/client";

export const USER_ROLES = ["CUSTOMER", "STAFF", "ADMIN"] as const;
export const USER_STATUSES = ["NEW", "INTERESTED", "QUOTED", "CLIENT", "CHURNED"] as const;
export const PLAYER_CATEGORIES = ["SIN_DEFINIR", "TERCERA", "SEGUNDA", "PRIMERA", "ELITE"] as const;
export const IDENTITY_DOCUMENT_TYPES = ["CEDULA_CIUDADANIA", "CEDULA_EXTRANJERIA", "PASAPORTE", "NIT"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type PlayerCategory = (typeof PLAYER_CATEGORIES)[number];
export type IdentityDocumentType = (typeof IDENTITY_DOCUMENT_TYPES)[number];

export type AdminUser = {
  _id: string;
  name?: string;
  phone?: string;
  ciudad?: string;
  identityDocument?: string;
  identityDocumentType?: IdentityDocumentType;
  playerCategory?: PlayerCategory;
  role?: UserRole;
  status?: UserStatus;
  createdAt?: string;
  updatedAt?: string;
  webAuth?: {
    email?: string;
  };
};

export type ListUsersAdminResponse = {
  ok: boolean;
  data: AdminUser[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type UpdateUserAdminInput = {
  name?: string;
  phone?: string;
  identityDocument?: string;
  identityDocumentType?: IdentityDocumentType;
  playerCategory?: PlayerCategory;
  role?: UserRole;
  status?: UserStatus;
};

export type UpdateUserAdminResponse = {
  ok: boolean;
  data: AdminUser;
};

export async function listUsersAdmin(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  playerCategory?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.role) searchParams.set("role", params.role);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.playerCategory) searchParams.set("playerCategory", params.playerCategory);

  const qs = searchParams.toString();

  return getJson<ListUsersAdminResponse>(`/api/users${qs ? `?${qs}` : ""}`, {
    credentials: "include",
    cache: "no-store",
  });
}

export async function updateUserAdmin(userId: string, input: UpdateUserAdminInput) {
  return patchJson<UpdateUserAdminResponse, UpdateUserAdminInput>(`/api/users/${userId}`, input, {
    credentials: "include",
  });
}
