"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError, postJson } from "@/lib/api/client";
import type { TournamentDetail } from "@/lib/api/public-content";
import { fetchSelfTournamentRegistrationState, type SelfTournamentRegistrationState } from "./registration-state";

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
  initialSelfRegistrationState?: SelfTournamentRegistrationState | null;
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

function getRegistrationStatusClass(status: string | null) {
  switch (status) {
    case "CONFIRMED":
      return "border-emerald-300/18 bg-emerald-400/10 text-emerald-100";
    case "PENDING":
      return "border-[rgba(246,196,79,0.16)] bg-[rgba(246,196,79,0.08)] text-[rgba(255,245,214,0.92)]";
    case "WAITLIST":
      return "border-sky-300/18 bg-sky-400/10 text-sky-100";
    case "CANCELLED":
      return "border-rose-300/18 bg-rose-400/10 text-rose-100";
    default:
      return "border-white/10 bg-white/5 text-white/82";
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

function getGroupStageSlotId(state: SelfTournamentRegistrationState | null | undefined) {
  return state?.registration?.groupStageSlotId ?? "";
}

export function TournamentRegistrationButton({
  tournamentId,
  isOpen,
  isFull,
  playersPerGroup,
  groupStageTables,
  groupStageSlots,
  registrations,
  initialSelfRegistrationState = null,
}: TournamentRegistrationButtonProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string>("");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [selfRegistrationState, setSelfRegistrationState] = useState<SelfTournamentRegistrationState | null>(initialSelfRegistrationState);
  const [selectedGroupStageSlotId, setSelectedGroupStageSlotId] = useState<string>(getGroupStageSlotId(initialSelfRegistrationState));
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isPending, startTransition] = useTransition();
  const syncRegistrationStateRef = useRef<(options?: { showLoadingState?: boolean }) => Promise<void>>(async () => {});

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
    if (initialSelfRegistrationState !== null) {
      return;
    }

    let isActive = true;

    void fetchSelfTournamentRegistrationState(tournamentId)
      .then((nextState) => {
        if (!isActive) {
          return;
        }

        setSelfRegistrationState(nextState);
        if (nextState?.registration?.groupStageSlotId) {
          setSelectedGroupStageSlotId(nextState.registration.groupStageSlotId);
        }
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setSelfRegistrationState(null);
      });

    return () => {
      isActive = false;
    };
  }, [initialSelfRegistrationState, tournamentId]);

  async function syncRegistrationState(options?: { showLoadingState?: boolean }) {
    if (options?.showLoadingState) {
      setIsCheckingStatus(true);
    }

    try {
      const nextState = await fetchSelfTournamentRegistrationState(tournamentId);
      setSelfRegistrationState(nextState);
      if (nextState?.registration?.groupStageSlotId) {
        setSelectedGroupStageSlotId(nextState.registration.groupStageSlotId);
      }
    } catch {
      setSelfRegistrationState(null);
    } finally {
      setIsCheckingStatus(false);
    }
  }

  useEffect(() => {
    syncRegistrationStateRef.current = syncRegistrationState;
  });

  const effectiveRegistrationStatus = selfRegistrationState?.registration?.status ?? null;
  const pendingReason = selfRegistrationState?.pendingReason ?? null;
  const canPay = selfRegistrationState?.canPay ?? false;
  const registrationStatusClass = getRegistrationStatusClass(effectiveRegistrationStatus);
  const hasLockedGroupStageSlot = Boolean(selfRegistrationState?.registration?.groupStageSlotId);
  const canResumePendingPayment = effectiveRegistrationStatus === "PENDING"
    && pendingReason === "PAYMENT_UNDER_REVIEW";
  const hasBlockingRegistration = effectiveRegistrationStatus === "CONFIRMED"
    || effectiveRegistrationStatus === "WAITLIST"
    || pendingReason === "CATEGORY_REVIEW";
  const disabled = !isOpen
    || isFull
    || areAllSlotsFull
    || isPending
    || isCheckingStatus
    || hasBlockingRegistration
    || (requiresGroupStageSlot && !selectedGroupStageSlotId);

  useEffect(() => {
    if (pendingReason !== "PAYMENT_UNDER_REVIEW") {
      return;
    }

    const expiresAt = selfRegistrationState?.payment?.expiresAt;
    if (!expiresAt) {
      return;
    }

    const expirationTime = new Date(expiresAt).getTime();
    if (Number.isNaN(expirationTime)) {
      return;
    }

    const timeoutMs = expirationTime - Date.now();
    const timeoutId = window.setTimeout(() => {
      void syncRegistrationStateRef.current();
    }, Math.max(timeoutMs, 0) + 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pendingReason, selfRegistrationState?.payment?.expiresAt]);

  function getIdleLabel() {
    if (effectiveRegistrationStatus === "CONFIRMED") {
      return "Ya estás inscrito";
    }

    if (effectiveRegistrationStatus === "PENDING") {
      if (pendingReason === "CATEGORY_REVIEW") {
        return "Pendiente por categoría";
      }

      if (pendingReason === "PAYMENT_UNDER_REVIEW") {
        return "Continuar pago";
      }

      if (canPay) {
        return "Pagar inscripción";
      }

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
        const shouldResumePayment = effectiveRegistrationStatus === "PENDING" && (canPay || canResumePendingPayment);
        const endpoint = shouldResumePayment
          ? `/api/tournaments/${tournamentId}/wompi/checkout`
          : `/api/tournaments/${tournamentId}/register-self`;
        const response = await postJson<RegistrationResponse, { groupStageSlotId?: string }>(
          endpoint,
          {
            ...(selectedGroupStageSlotId ? { groupStageSlotId: selectedGroupStageSlotId } : {}),
          },
          { credentials: "include" },
        );

        if (response.requiresPayment || shouldResumePayment) {
          const wompiUrl = buildWompiCheckoutUrl(response.data ?? {});

          if (!wompiUrl) {
            setFeedback("Tu inscripción fue creada, pero no se pudo preparar la redirección al pago.");
            await syncRegistrationState({ showLoadingState: true });
            return;
          }

          window.location.assign(wompiUrl);
          return;
        } else {
          setFeedback(response.message ?? "Inscripción realizada correctamente.");
        }

        router.refresh();
        await syncRegistrationState({ showLoadingState: true });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setShowAuthPrompt(true);
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
      {requiresGroupStageSlot && !hasLockedGroupStageSlot ? (
        <label className="grid gap-2">
          <span className="text-sm font-medium text-white/82">Elige día y horario de grupos</span>
          <select
            className="min-w-0 w-full rounded-2xl border border-white/10 bg-[#17191d] px-4 py-3 text-sm text-white outline-none transition focus:border-accent"
            value={selectedGroupStageSlotId}
            onChange={(event) => {
              setFeedback("");
              setSelectedGroupStageSlotId(event.target.value);
            }}
            disabled={hasBlockingRegistration || hasLockedGroupStageSlot || isPending || isCheckingStatus}
          >
            <option value="">Selecciona un horario</option>
            {slotsWithAvailability.map((slot) => (
              <option key={slot.id} value={slot.id} disabled={slot.isFull && slot.id !== initialSelfRegistrationState?.registration?.groupStageSlotId}>
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
              Horario elegido: 
              {buildSlotLabel(selectedSlot)}
            </span>
          ) : null}
        </label>
      ) : null}

      {requiresGroupStageSlot && hasLockedGroupStageSlot && selectedSlot ? (
        <div className="rounded-[1.2rem] border border-[rgba(246,196,79,0.16)] bg-[rgba(246,196,79,0.08)] px-4 py-3 text-sm leading-7 text-[rgba(255,245,214,0.92)]">
          Tu horario ya quedó reservado: {buildSlotLabel(selectedSlot)}
        </div>
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

      {showAuthPrompt ? (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/72 px-4">
          <div className="w-full max-w-md rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,18,26,0.98),rgba(10,13,19,0.98))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Acceso requerido</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Necesitas una cuenta para inscribirte</h3>
            <p className="mt-3 text-sm leading-7 text-white/74">
              Para registrarte al torneo debes iniciar sesión o crear una cuenta. Así el sistema puede guardar tu inscripción, tu horario y el estado de tu pago.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                className="rounded-full border border-white/12 px-4 py-3 text-sm font-medium text-white/82 transition hover:bg-white/8"
                type="button"
                onClick={() => {
                  setShowAuthPrompt(false);
                  router.push("/login");
                }}
              >
                Iniciar sesión
              </button>
              <button
                className="rounded-full bg-accent px-4 py-3 text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong"
                type="button"
                onClick={() => {
                  setShowAuthPrompt(false);
                  router.push("/register");
                }}
              >
                Crear cuenta
              </button>
            </div>

            <button
              className="mt-3 w-full rounded-full border border-white/10 px-4 py-3 text-sm font-medium text-white/62 transition hover:bg-white/6 hover:text-white"
              type="button"
              onClick={() => setShowAuthPrompt(false)}
            >
              Seguir viendo el torneo
            </button>
          </div>
        </div>
      ) : null}

      {effectiveRegistrationStatus ? (
        <p className={`rounded-[1.2rem] border px-4 py-3 text-sm leading-7 ${registrationStatusClass}`}>
          Estado actual: {humanizeRegistrationStatus(effectiveRegistrationStatus) ?? effectiveRegistrationStatus}
        </p>
      ) : null}
    </div>
  );
}