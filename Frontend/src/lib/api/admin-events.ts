import { deleteJson, postFormData, postJson, putJson } from "@/lib/api/client";

export const EVENT_STATUSES = ["SCHEDULED", "LIVE", "FINISHED", "CANCELLED"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_TYPES = ["CUP", "MASTER", "CHAMPIONSHIP", "OPEN", "EXHIBITION", "OTHER"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TIERS = [
  "WORLD",
  "INTERNATIONAL",
  "NATIONAL",
  "DEPARTMENTAL",
  "REGIONAL",
  "LOCAL",
] as const;
export type EventTier = (typeof EVENT_TIERS)[number];

export const EVENT_REGISTRATION_MODES = ["NONE", "EXTERNAL_LINK", "INTERNAL"] as const;
export type EventRegistrationMode = (typeof EVENT_REGISTRATION_MODES)[number];

export const EVENT_TICKETING_MODES = ["NO_TICKETS", "EXTERNAL_LINK", "INTERNAL"] as const;
export type EventTicketingMode = (typeof EVENT_TICKETING_MODES)[number];

export type CreateAdminEventInput = {
  name: string;
  type: EventType;
  tier: EventTier;
  startDate: string;
  endDate?: string;
  status?: EventStatus;
  description?: string;
  organizer?: string;
  location?: string;
  city?: string;
  department?: string;
  country?: string;
  entryFee?: number;
  registrationMode?: EventRegistrationMode;
  registrationUrl?: string;
  imageUrl?: string;
  streamUrl?: string;
  hasGrandstand?: boolean;
  grandstandDetails?: string;
  ticketingMode?: EventTicketingMode;
  ticketPrice?: number;
  ticketUrl?: string;
  resultsUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  featured?: boolean;
};

export type UpdateAdminEventInput = Partial<CreateAdminEventInput>;

export type AdminEventResponse = {
  ok: boolean;
  data: {
    _id?: string;
    slug?: string;
    name?: string;
    type?: string;
    tier?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    entryFee?: number;
    featured?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    tags?: string[];
  };
};

export type DeleteAdminEventResponse = { ok: boolean };

export type UploadEventImageResponse = {
  ok: boolean;
  data: { url: string; publicId?: string };
};

export async function uploadEventImage(file: File, name?: string): Promise<UploadEventImageResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "billar-en-linea/eventos");
  if (name && name.trim().length > 0) {
    formData.append(
      "publicId",
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    );
  }
  formData.append("tags", "eventos,admin,frontend-lab");
  return postFormData<UploadEventImageResponse>("/api/admin/uploads/images", formData, {
    credentials: "include",
  });
}

export async function createEventAdmin(input: CreateAdminEventInput) {
  return postJson<AdminEventResponse, CreateAdminEventInput>("/api/events", input, {
    credentials: "include",
  });
}

export async function updateEventAdmin(eventId: string, input: UpdateAdminEventInput) {
  return putJson<AdminEventResponse, UpdateAdminEventInput>(`/api/events/${eventId}`, input, {
    credentials: "include",
  });
}

export async function deleteEventAdmin(eventId: string) {
  return deleteJson<DeleteAdminEventResponse>(`/api/events/${eventId}`, {
    credentials: "include",
  });
}
