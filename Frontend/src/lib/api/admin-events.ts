import { patchJson } from "@/lib/api/client";

export const EVENT_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "LIVE",
  "FINISHED",
  "CANCELLED",
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export type UpdateAdminEventInput = {
  name?: string;
  type?: string;
  tier?: string;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  entryFee?: number;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
};

export type UpdateAdminEventResponse = {
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
  };
};

export async function updateEventAdmin(eventId: string, input: UpdateAdminEventInput) {
  return patchJson<UpdateAdminEventResponse, UpdateAdminEventInput>(`/api/events/${eventId}`, input, {
    credentials: "include",
  });
}
