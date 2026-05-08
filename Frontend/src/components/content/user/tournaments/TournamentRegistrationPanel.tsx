"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { TournamentDetail } from "@/lib/api/public-content";
import { TournamentRegistrationButton } from "./TournamentRegistrationButton";
import { fetchSelfTournamentRegistrationState, type SelfTournamentRegistrationState } from "./registration-state";

function subscribeToHydration() {
  return () => {};
}

type TournamentRegistrationPanelProps = {
  tournamentId: string;
  isOpen: boolean;
  isFull: boolean;
  entryFee: TournamentDetail["entryFee"];
  discount20Deadline: TournamentDetail["discount20Deadline"];
  discount10Deadline: TournamentDetail["discount10Deadline"];
  registrations: TournamentDetail["registrations"];
  playersPerGroup: TournamentDetail["playersPerGroup"];
  groupStageTables: TournamentDetail["groupStageTables"];
  groupStageSlots: TournamentDetail["groupStageSlots"];
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUrgencyDeadline(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function resolveActiveDiscount(
  discount20Deadline: string | null,
  discount10Deadline: string | null,
) {
  const now = Date.now();

  if (discount20Deadline) {
    const parsed = new Date(discount20Deadline);
    if (!Number.isNaN(parsed.getTime()) && now <= parsed.getTime()) {
      return {
        percentage: 20,
        deadline: discount20Deadline,
      };
    }
  }

  if (discount10Deadline) {
    const parsed = new Date(discount10Deadline);
    if (!Number.isNaN(parsed.getTime()) && now <= parsed.getTime()) {
      return {
        percentage: 10,
        deadline: discount10Deadline,
      };
    }
  }

  return null;
}

function getRegistrationMessage(status: string | null, pendingReason: SelfTournamentRegistrationState["pendingReason"]) {
  if (status === "CONFIRMED") {
    return "Ya estás inscrito en este torneo. Tu cupo ya fue confirmado y no necesitas volver a registrarte.";
  }

  if (status === "PENDING") {
    if (pendingReason === "CATEGORY_REVIEW") {
      return "Ya tienes una inscripción creada en este torneo, pero sigue pendiente porque tu categoría aún no ha sido definida. Un administrador debe revisarla antes de confirmar tu cupo.";
    }

    if (pendingReason === "PAYMENT_UNDER_REVIEW") {
      return "Ya tienes una inscripción creada en este torneo y tu pago está en proceso de validación. Cuando sea aprobado, tu cupo quedará confirmado.";
    }

    return "Ya tienes una inscripción creada en este torneo, pero el pago aún no se ha completado. Puedes usar el botón para pagarlo en cualquier momento y continuar con la confirmación.";
  }

  if (status === "WAITLIST") {
    return "Ya estás inscrito en la lista de espera de este torneo. No necesitas enviar otra solicitud.";
  }

  return "Reserva tu cupo usando tu sesión actual. Si el torneo requiere pago, el siguiente paso será completar esa confirmación.";
}

export function TournamentRegistrationPanel({
  tournamentId,
  isOpen,
  isFull,
  entryFee,
  discount20Deadline,
  discount10Deadline,
  registrations,
  playersPerGroup,
  groupStageTables,
  groupStageSlots,
}: TournamentRegistrationPanelProps) {
  const [selfRegistrationState, setSelfRegistrationState] = useState<SelfTournamentRegistrationState | null>(null);
  const hasHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  useEffect(() => {
    let isActive = true;

    void fetchSelfTournamentRegistrationState(tournamentId)
      .then((nextState) => {
        if (!isActive) {
          return;
        }

        setSelfRegistrationState(nextState);
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
  }, [tournamentId]);

  const registrationStatus = selfRegistrationState?.registration?.status ?? null;
  const activeDiscount = hasHydrated
    ? resolveActiveDiscount(discount20Deadline, discount10Deadline)
    : null;
  const discountedAmount = activeDiscount && typeof entryFee === "number"
    ? Math.round(entryFee * ((100 - activeDiscount.percentage) / 100))
    : null;

  const hasRegistration = registrationStatus === "CONFIRMED"
    || registrationStatus === "PENDING"
    || registrationStatus === "WAITLIST";

  const discountMessage = activeDiscount && registrationStatus === "PENDING"
    ? `Termina de hacer tu pago con el ${activeDiscount.percentage}% de descuento y paga ${discountedAmount !== null ? formatMoney(discountedAmount) : "la tarifa preferencial"}. Esta tarifa vence el ${formatUrgencyDeadline(activeDiscount.deadline)}.`
    : null;

  return (
    <section className="rounded-[1.8rem] border border-[rgba(246,196,79,0.16)] bg-[linear-gradient(180deg,rgba(246,196,79,0.08),rgba(255,255,255,0.03))] p-5">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Registro</p>
      <p className={`mt-4 text-sm leading-7 ${hasRegistration ? "text-emerald-100/88" : "text-white/78"}`}>
        {getRegistrationMessage(registrationStatus, selfRegistrationState?.pendingReason ?? null)}
      </p>
      {discountMessage ? (
        <div className="mt-4 rounded-[1.25rem] border border-[rgba(246,196,79,0.24)] bg-[rgba(246,196,79,0.09)] px-4 py-3 text-sm leading-7 text-[rgba(255,244,214,0.92)]">
          {discountMessage}
        </div>
      ) : null}
      <div className="mt-4">
        <TournamentRegistrationButton
          tournamentId={tournamentId}
          isOpen={isOpen}
          isFull={isFull}
          playersPerGroup={playersPerGroup}
          groupStageTables={groupStageTables}
          groupStageSlots={groupStageSlots}
          registrations={registrations}
          initialSelfRegistrationState={selfRegistrationState}
        />
      </div>
    </section>
  );
}