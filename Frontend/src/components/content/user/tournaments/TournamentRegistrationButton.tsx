"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError, postJson } from "@/lib/api/client";
import { getCurrentSession } from "@/lib/api/auth";
import { getJson } from "@/lib/api/client";
import type { TournamentDetail } from "@/lib/api/public-content";

type TournamentRegistrationButtonProps = {
  tournamentId: string;
  isOpen: boolean;
  isFull: boolean;
  playersPerGroup: number | null;
  groupStageTables: number | null;
  groupStageSlots: Array<{
    id: string;
    date: string | null;
    startTime: string | null;
    endTime: string | null;
    label: string | null;
  }>;
  registrations: TournamentDetail["registrations"];
  initialRegistrationStatus?: string | null;
  initialGroupStageSlotId?: string | null;
};

type RegistrationResponse = {
  ok: boolean;
  requiresPayment?: boolean;
  registrationStatus?: string;
  message?: string;
  data?: WompiCheckoutConfig;
};

type WompiCheckoutConfig = {
  checkoutUrl?: string;
  publicKey?: string;
  currency?: string;
  amountInCents?: number;
  reference?: string;
  redirectUrl?: string;
  expirationTime?: string;
  signature?: {
    integrity?: string;
  };
  customerData?: {
    email?: string;
    fullName?: string;
    phoneNumberPrefix?: string;
    phoneNumber?: string;
  };
};

type TournamentRegistrationsResponse = {
  data?: TournamentRegistrationItem[];
};

type TournamentRegistrationItem = {
  status?: string;
  groupStageSlotId?: string;
  user?: {
    _id?: string;
  } | null;
};

async function fetchRegistrationStatus(tournamentId: string) {
  const session = await getCurrentSession().catch(() => null);
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return null;
  }

  const payload = await getJson<TournamentRegistrationsResponse>(`/api/tournaments/${tournamentId}/registrations`, {
    credentials: "include",
  });

  const registrations = Array.isArray(payload.data) ? payload.data : [];
  const currentRegistration = registrations.find((registration) => registration.user?._id === currentUserId);

  return {
    status: typeof currentRegistration?.status === "string" ? currentRegistration.status : null,
    groupStageSlotId: typeof currentRegistration?.groupStageSlotId === "string" ? currentRegistration.groupStageSlotId : null,
  };
}

function formatSlotDate(value: string | null) {
  if (!value) {
    return "Fecha por anunciar";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "full",
  }).format(parsed);
}

function buildSlotLabel(slot: TournamentRegistrationButtonProps["groupStageSlots"][number]) {
  const timeRange = [slot.startTime, slot.endTime].filter(Boolean).join(" - ");
  const labelParts = [slot.label, formatSlotDate(slot.date), timeRange].filter(Boolean);

  return labelParts.join(" · ");
}

function humanizeRegistrationStatus(status: string | null) {
  switch (status) {
    case "CONFIRMED":
      return "Inscripción confirmada";
    case "PENDING":
      return "Inscripción pendiente";
    case "WAITLIST":
      return "En lista de espera";
    case "CANCELLED":
      return "Inscripción cancelada";
    default:
      return null;
  }
}

function buildWompiCheckoutUrl(config: WompiCheckoutConfig) {
  if (!config.checkoutUrl || !config.publicKey || !config.currency || !config.amountInCents || !config.reference) {
    return null;
  }

  const params = new URLSearchParams({
    "public-key": config.publicKey,
    currency: config.currency,
    "amount-in-cents": String(config.amountInCents),
    reference: config.reference,
  });

  if (config.redirectUrl) {
    params.set("redirect-url", config.redirectUrl);
  }

  if (config.expirationTime) {
    params.set("expiration-time", config.expirationTime);
  }

  if (config.signature?.integrity) {
    params.set("signature:integrity", config.signature.integrity);
  }

  if (config.customerData?.email) {
    params.set("customer-data:email", config.customerData.email);
  }

  if (config.customerData?.fullName) {
    params.set("customer-data:full-name", config.customerData.fullName);
  }

  if (config.customerData?.phoneNumberPrefix) {
    params.set("customer-data:phone-number-prefix", config.customerData.phoneNumberPrefix);
  }

  if (config.customerData?.phoneNumber) {
    params.set("customer-data:phone-number", config.customerData.phoneNumber);
  }

  return `${config.checkoutUrl}?${params.toString()}`;
}

export function TournamentRegistrationButton({
  tournamentId,
  isOpen,
  isFull,
  playersPerGroup,
  groupStageTables,
  groupStageSlots,
  registrations,
  initialRegistrationStatus = null,
  initialGroupStageSlotId = null,
}: TournamentRegistrationButtonProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string>("");
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [selectedGroupStageSlotId, setSelectedGroupStageSlotId] = useState<string>(initialGroupStageSlotId ?? "");
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isPending, startTransition] = useTransition();

  const slotCapacity = groupStageTables && playersPerGroup
    ? groupStageTables * playersPerGroup
    : null;
  const activeStatuses = new Set(["PENDING", "CONFIRMED"]);
  const slotsWithAvailability = groupStageSlots.map((slot) => {
    const reserved = registrations.filter((registration) => (
      registration.groupStageSlotId === slot.id
      && registration.status
      && activeStatuses.has(registration.status)
    )).length;
    const remaining = slotCapacity === null ? null : Math.max(slotCapacity - reserved, 0);

    return {
      ...slot,
      reserved,
      remaining,
      isFull: remaining !== null ? remaining <= 0 : false,
    };
  });
  const requiresGroupStageSlot = slotsWithAvailability.length > 0;
  const areAllSlotsFull = requiresGroupStageSlot && slotsWithAvailability.every((slot) => slot.isFull);
  const selectedSlot = slotsWithAvailability.find((slot) => slot.id === selectedGroupStageSlotId) ?? null;

  useEffect(() => {
    if (initialRegistrationStatus !== null) {
      return;
    }

    let isActive = true;

    void fetchRegistrationStatus(tournamentId)
      .then((nextStatus) => {
        if (!isActive) {
          return;
        }

        setRegistrationStatus(nextStatus?.status ?? null);
        if (nextStatus?.groupStageSlotId) {
          setSelectedGroupStageSlotId(nextStatus.groupStageSlotId);
        }
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setRegistrationStatus(null);
      });

    return () => {
      isActive = false;
    };
  }, [initialRegistrationStatus, tournamentId]);

  async function syncRegistrationState(options?: { showLoadingState?: boolean }) {
    if (options?.showLoadingState) {
      setIsCheckingStatus(true);
    }

    try {
      const nextStatus = await fetchRegistrationStatus(tournamentId);
      setRegistrationStatus(nextStatus?.status ?? null);
      if (nextStatus?.groupStageSlotId) {
        setSelectedGroupStageSlotId(nextStatus.groupStageSlotId);
      }
    } catch {
      setRegistrationStatus(null);
    } finally {
      setIsCheckingStatus(false);
    }
  }

  const effectiveRegistrationStatus = registrationStatus ?? initialRegistrationStatus;
  const hasActiveRegistration = effectiveRegistrationStatus === "PENDING"
    || effectiveRegistrationStatus === "CONFIRMED"
    || effectiveRegistrationStatus === "WAITLIST";
  const disabled = !isOpen
    || isFull
    || areAllSlotsFull
    || isPending
    || isCheckingStatus
    || hasActiveRegistration
    || (requiresGroupStageSlot && !selectedGroupStageSlotId);

  function getIdleLabel() {
    if (effectiveRegistrationStatus === "CONFIRMED") {
      return "Ya estás inscrito";
    }

    if (effectiveRegistrationStatus === "PENDING") {
      return "Inscripción pendiente";
    }

    if (effectiveRegistrationStatus === "WAITLIST") {
      return "En lista de espera";
    }

    if (!isOpen) {
      return "Inscripciones cerradas";
    }

    if (isFull) {
      return "Cupos agotados";
    }

    if (areAllSlotsFull) {
      return "Horarios agotados";
    }

    return "Inscribirme al torneo";
  }

  function handleRegister() {
    if (disabled) {
      return;
    }

    setFeedback("");

    startTransition(async () => {
      try {
        const response = await postJson<RegistrationResponse, { groupStageSlotId?: string }>(
          `/api/tournaments/${tournamentId}/register-self`,
          {
            ...(selectedGroupStageSlotId ? { groupStageSlotId: selectedGroupStageSlotId } : {}),
          },
          { credentials: "include" },
        );

        if (response.requiresPayment) {
          const wompiUrl = buildWompiCheckoutUrl(response.data ?? {});

          if (!wompiUrl) {
            setFeedback("Tu inscripción fue creada, pero no se pudo preparar la redirección al pago.");
            setRegistrationStatus(response.registrationStatus ?? "PENDING");
            return;
          }

          window.location.assign(wompiUrl);
          return;
        } else {
          setRegistrationStatus(response.registrationStatus ?? null);
          setFeedback(response.message ?? "Inscripción realizada correctamente.");
        }

        router.refresh();
        await syncRegistrationState({ showLoadingState: true });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.push("/login");
          return;
        }

        if (error instanceof ApiError && error.message.includes("ya está inscrito en este torneo")) {
          await syncRegistrationState({ showLoadingState: true });
        }

        setFeedback(
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "No fue posible completar la inscripción.",
        );
      }
    });
  }

  return (
    <div className="grid gap-3">
      {requiresGroupStageSlot ? (
        <label className="grid gap-2">
          <span className="text-sm font-medium text-white/82">Elige día y horario de grupos</span>
          <select
            className="min-w-0 w-full rounded-2xl border border-white/10 bg-[#17191d] px-4 py-3 text-sm text-white outline-none transition focus:border-accent"
            value={selectedGroupStageSlotId}
            onChange={(event) => {
              setFeedback("");
              setSelectedGroupStageSlotId(event.target.value);
            }}
            disabled={hasActiveRegistration || isPending || isCheckingStatus}
          >
            <option value="">Selecciona un horario</option>
            {slotsWithAvailability.map((slot) => (
              <option key={slot.id} value={slot.id} disabled={slot.isFull && slot.id !== initialGroupStageSlotId}>
                {buildSlotLabel(slot)}{slot.remaining !== null ? ` · ${slot.remaining} cupos` : ""}
              </option>
            ))}
          </select>
          {slotCapacity !== null ? (
            <span className="text-xs leading-6 text-white/52">
              Cada franja admite hasta {slotCapacity} jugadores ({groupStageTables} mesas x {playersPerGroup} jugadores por grupo).
            </span>
          ) : null}
          {selectedSlot ? (
            <span className="text-xs leading-6 text-[rgba(246,196,79,0.82)]">
              Horario elegido: {buildSlotLabel(selectedSlot)}
            </span>
          ) : null}
        </label>
      ) : null}

      <button
        className="inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#0b0b0d] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45"
        type="button"
        disabled={disabled}
        onClick={handleRegister}
      >
        {isPending ? "Procesando inscripción..." : getIdleLabel()}
      </button>

      {feedback ? (
        <p className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-white/76">
          {feedback}
        </p>
      ) : null}

      {effectiveRegistrationStatus ? (
        <p className="rounded-[1.2rem] border border-[rgba(246,196,79,0.16)] bg-[rgba(246,196,79,0.08)] px-4 py-3 text-sm leading-7 text-[rgba(255,245,214,0.92)]">
          Estado actual: {humanizeRegistrationStatus(effectiveRegistrationStatus) ?? effectiveRegistrationStatus}
        </p>
      ) : null}
    </div>
  );
}