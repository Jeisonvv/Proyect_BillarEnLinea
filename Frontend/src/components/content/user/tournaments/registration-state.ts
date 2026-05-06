import { getCurrentSession } from "@/lib/api/auth";
import { getJson } from "@/lib/api/client";

export type SelfTournamentRegistrationState = {
  registration: {
    id: string;
    status: string | null;
    playerCategory: string | null;
    groupStageSlotId: string | null;
    paymentMethod: string | null;
    paymentReference: string | null;
    paidAt: string | null;
  } | null;
  payment: {
    id: string;
    status: string | null;
    reference: string | null;
    expiresAt: string | null;
    transactionId: string | null;
    providerMethod: string | null;
    normalizedPaymentMethod: string | null;
    redirectUrl: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
  pendingReason: "CATEGORY_REVIEW" | "PAYMENT_UNDER_REVIEW" | "PAYMENT_REQUIRED" | null;
  canPay: boolean;
};

export async function fetchSelfTournamentRegistrationState(tournamentId: string) {
  const session = await getCurrentSession().catch(() => null);

  if (!session?.user?.id) {
    return null;
  }

  const payload = await getJson<{ data?: SelfTournamentRegistrationState }>(
    `/api/tournaments/${tournamentId}/self-registration-status`,
    { credentials: "include" },
  );

  return payload.data ?? null;
}