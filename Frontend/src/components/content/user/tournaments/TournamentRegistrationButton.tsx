"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError, postJson } from "@/lib/api/client";
import type { TournamentDetail } from "@/lib/api/public-content";
import { AuthPromptModal } from "@/components/content/user/shared";
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

function buildSlotTimeLabel(slot: TournamentRegistrationButtonProps["groupStageSlots"][number]) {
  const timeRange = [slot.startTime, slot.endTime].filter(Boolean).join(" - ");
  return timeRange || "Hora por anunciar";
}

function getJornadaKey(slot: TournamentRegistrationButtonProps["groupStageSlots"][number]) {
  return slot.label?.trim() || "__sin_jornada__";
}

function getJornadaLabel(slot: TournamentRegistrationButtonProps["groupStageSlots"][number]) {
  return slot.label?.trim() || "Jornada principal";
}

function getDateKey(slot: TournamentRegistrationButtonProps["groupStageSlots"][number]) {
  return slot.date ?? "__sin_fecha__";
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

function subscribeToHydration() {
  return () => {};
}

type SaveSlotResponse = {
  ok: boolean;
  message?: string;
};

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
  const hasHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
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

  // ── Cascada: día → jornada → hora ────────────────────────────────────────
  const [selectedDateKey, setSelectedDateKey] = useState<string>("");
  const [selectedJornadaKey, setSelectedJornadaKey] = useState<string>("");

  // Días únicos (orden por fecha asc; las nulas al final).
  const dateOptions = (() => {
    const seen = new Map<string, { key: string; date: string | null }>();
    for (const slot of slotsWithAvailability) {
      const key = getDateKey(slot);
      if (!seen.has(key)) seen.set(key, { key, date: slot.date });
    }
    return Array.from(seen.values()).sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
  })();

  // Slot ya elegido (puede venir del backend) para hidratar la cascada.
  const lockedSlot = selectedGroupStageSlotId
    ? slotsWithAvailability.find((slot) => slot.id === selectedGroupStageSlotId) ?? null
    : null;

  // Día efectivo: el del slot bloqueado, el seleccionado por el usuario, o el único disponible.
  const effectiveDateKey = lockedSlot
    ? getDateKey(lockedSlot)
    : selectedDateKey || (dateOptions.length === 1 ? dateOptions[0].key : "");

  // Jornadas para el día efectivo.
  const jornadaOptions = (() => {
    if (!effectiveDateKey) return [];
    const seen = new Map<string, { key: string; label: string }>();
    for (const slot of slotsWithAvailability) {
      if (getDateKey(slot) !== effectiveDateKey) continue;
      const key = getJornadaKey(slot);
      if (!seen.has(key)) seen.set(key, { key, label: getJornadaLabel(slot) });
    }
    return Array.from(seen.values());
  })();

  const effectiveJornadaKey = lockedSlot
    ? getJornadaKey(lockedSlot)
    : selectedJornadaKey || (jornadaOptions.length === 1 ? jornadaOptions[0].key : "");

  // Horas para el día + jornada efectivos.
  const hourOptions = slotsWithAvailability.filter(
    (slot) => effectiveDateKey && getDateKey(slot) === effectiveDateKey
      && effectiveJornadaKey && getJornadaKey(slot) === effectiveJornadaKey,
  );

  // Slot efectivo: el seleccionado, o el único disponible cuando ya hay día+jornada.
  const effectiveSlotId = selectedGroupStageSlotId
    || (effectiveJornadaKey && hourOptions.length === 1 ? hourOptions[0].id : "");
  const selectedSlot = slotsWithAvailability.find((slot) => slot.id === effectiveSlotId) ?? null;

  function handleDateChange(nextKey: string) {
    setFeedback("");
    setSelectedDateKey(nextKey);
    setSelectedJornadaKey("");
    setSelectedGroupStageSlotId("");
  }

  function handleJornadaChange(nextKey: string) {
    setFeedback("");
    setSelectedJornadaKey(nextKey);
    setSelectedGroupStageSlotId("");
  }

  async function persistSelectedSlot(nextSlotId: string) {
    if (!nextSlotId || hasLockedGroupStageSlot) {
      return;
    }

    try {
      await postJson<SaveSlotResponse, { groupStageSlotId: string }>(
        `/api/tournaments/${tournamentId}/self-registration-slot`,
        { groupStageSlotId: nextSlotId },
        { credentials: "include" },
      );

      await syncRegistrationState();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setShowAuthPrompt(true);
      }
    }
  }

  function handleHourChange(nextSlotId: string) {
    setFeedback("");
    setSelectedGroupStageSlotId(nextSlotId);
    void persistSelectedSlot(nextSlotId);
  }

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
  const isTournamentFullPending = pendingReason === "TOURNAMENT_FULL";
  const hasLockedGroupStageSlot = Boolean(selfRegistrationState?.registration?.groupStageSlotId);
  const canResumePendingPayment = effectiveRegistrationStatus === "PENDING"
    && pendingReason === "PAYMENT_UNDER_REVIEW";
  const hasBlockingRegistration = effectiveRegistrationStatus === "CONFIRMED"
    || effectiveRegistrationStatus === "WAITLIST"
    || pendingReason === "CATEGORY_REVIEW"
    || pendingReason === "TOURNAMENT_FULL";
  const disabled = !isOpen
    || isFull
    || areAllSlotsFull
    || isPending
    || isCheckingStatus
    || hasBlockingRegistration
    || (requiresGroupStageSlot && !effectiveSlotId);

  function getBlockingReason() {
    if (isCheckingStatus) {
      return "Estamos verificando el estado de tu inscripción.";
    }

    if (isPending) {
      return "Hay una operación en curso. Espera unos segundos para continuar.";
    }

    if (!isOpen) {
      return "Las inscripciones del torneo están cerradas en este momento.";
    }

    if (isFull) {
      return "No hay cupos disponibles para este torneo.";
    }

    if (areAllSlotsFull) {
      return "Todos los días y horarios de grupos están llenos.";
    }

    if (effectiveRegistrationStatus === "CONFIRMED") {
      return "Tu inscripción ya fue confirmada. No necesitas pagar nuevamente.";
    }

    if (effectiveRegistrationStatus === "WAITLIST") {
      return "Tu inscripción está en lista de espera. Debes esperar confirmación del cupo.";
    }

    if (pendingReason === "CATEGORY_REVIEW") {
      return "Tu inscripción está pendiente porque tu categoría aún no ha sido aprobada por administración.";
    }

    if (pendingReason === "TOURNAMENT_FULL") {
      return "Tu inscripción está pendiente, pero el torneo ya no tiene cupos confirmables disponibles.";
    }

    if (requiresGroupStageSlot && !effectiveSlotId) {
      return "Selecciona día, jornada y hora para habilitar el pago de la inscripción.";
    }

    return null;
  }

  const blockingReason = disabled ? getBlockingReason() : null;

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

      if (pendingReason === "TOURNAMENT_FULL") {
        return "Cupos agotados";
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
            ...(effectiveSlotId ? { groupStageSlotId: effectiveSlotId } : {}),
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
        <div className="grid gap-3">
          <span className="text-sm font-medium text-white/82">Elige día y horario de grupos</span>

          {dateOptions.length > 1 ? (
            <label className="grid gap-1.5">
              <span className="text-xs uppercase tracking-[0.18em] text-white/52">Día</span>
              <select
                className="min-w-0 w-full rounded-2xl border border-white/10 bg-[#17191d] px-4 py-3 text-sm text-white outline-none transition focus:border-accent"
                value={effectiveDateKey}
                onChange={(event) => handleDateChange(event.target.value)}
                disabled={hasBlockingRegistration || hasLockedGroupStageSlot || isPending || isCheckingStatus}
              >
                <option value="">Selecciona un día</option>
                {dateOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {formatSlotDate(option.date)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {effectiveDateKey && jornadaOptions.length > 1 ? (
            <label className="grid gap-1.5">
              <span className="text-xs uppercase tracking-[0.18em] text-white/52">Jornada</span>
              <select
                className="min-w-0 w-full rounded-2xl border border-white/10 bg-[#17191d] px-4 py-3 text-sm text-white outline-none transition focus:border-accent"
                value={effectiveJornadaKey}
                onChange={(event) => handleJornadaChange(event.target.value)}
                disabled={hasBlockingRegistration || hasLockedGroupStageSlot || isPending || isCheckingStatus}
              >
                <option value="">Selecciona una jornada</option>
                {jornadaOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {effectiveJornadaKey && hourOptions.length > 1 ? (
            <label className="grid gap-1.5">
              <span className="text-xs uppercase tracking-[0.18em] text-white/52">Hora</span>
              <select
                className="min-w-0 w-full rounded-2xl border border-white/10 bg-[#17191d] px-4 py-3 text-sm text-white outline-none transition focus:border-accent"
                value={effectiveSlotId}
                onChange={(event) => handleHourChange(event.target.value)}
                disabled={hasBlockingRegistration || hasLockedGroupStageSlot || isPending || isCheckingStatus}
              >
                <option value="">Selecciona una hora</option>
                {hourOptions.map((slot) => (
                  <option
                    key={slot.id}
                    value={slot.id}
                    disabled={slot.isFull && slot.id !== initialSelfRegistrationState?.registration?.groupStageSlotId}
                  >
                    {buildSlotTimeLabel(slot)}{slot.remaining !== null ? ` · ${slot.remaining} cupos` : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {slotCapacity !== null ? (
            <span className="text-xs leading-6 text-white/52">
              Cada franja admite hasta {slotCapacity} jugadores ({groupStageTables} mesas x {playersPerGroup} jugadores por grupo).
            </span>
          ) : null}
          {selectedSlot ? (
            <span className="text-xs leading-6 text-[rgba(246,196,79,0.82)]">
              Horario elegido: {buildSlotLabel(selectedSlot)}
              {selectedSlot.remaining !== null ? ` · ${selectedSlot.remaining} cupos` : ""}
            </span>
          ) : null}
        </div>
      ) : null}

      {requiresGroupStageSlot && hasLockedGroupStageSlot && selectedSlot ? (
        <div className="rounded-[1.2rem] border border-[rgba(246,196,79,0.16)] bg-[rgba(246,196,79,0.08)] px-4 py-3 text-sm leading-7 text-[rgba(255,245,214,0.92)]">
          Tu horario ya quedó reservado: {buildSlotLabel(selectedSlot)}
        </div>
      ) : null}

      <button
        className={`inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${
          isTournamentFullPending
            ? "bg-rose-500 text-white hover:bg-rose-500 disabled:bg-rose-900/45 disabled:text-rose-100"
            : "bg-accent text-[#0b0b0d] hover:bg-accent-strong disabled:bg-white/10 disabled:text-white/45"
        }`}
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

      {hasHydrated && !feedback && blockingReason ? (
        <p className="rounded-[1.2rem] border border-[rgba(246,196,79,0.2)] bg-[rgba(246,196,79,0.08)] px-4 py-3 text-sm leading-7 text-[rgba(255,245,214,0.92)]">
          {blockingReason}
        </p>
      ) : null}

      {showAuthPrompt ? (
        <AuthPromptModal
          open={showAuthPrompt}
          onClose={() => setShowAuthPrompt(false)}
          title="Necesitas una cuenta para inscribirte"
          description="Para registrarte al torneo debes iniciar sesión o crear una cuenta. Así el sistema puede guardar tu inscripción, tu horario y el estado de tu pago."
          dismissLabel="Seguir viendo el torneo"
        />
      ) : null}

      {effectiveRegistrationStatus ? (
        <p className={`rounded-[1.2rem] border px-4 py-3 text-sm leading-7 ${registrationStatusClass}`}>
          Estado actual: {humanizeRegistrationStatus(effectiveRegistrationStatus) ?? effectiveRegistrationStatus}
        </p>
      ) : null}
    </div>
  );
}