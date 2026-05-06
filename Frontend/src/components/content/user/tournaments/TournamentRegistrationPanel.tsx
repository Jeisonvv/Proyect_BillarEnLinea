"use client";

import { useEffect, useState } from "react";
import type { TournamentDetail } from "@/lib/api/public-content";
import { TournamentRegistrationButton } from "./TournamentRegistrationButton";
import { fetchSelfTournamentRegistrationState, type SelfTournamentRegistrationState } from "./registration-state";

type TournamentRegistrationPanelProps = {
  tournamentId: string;
  isOpen: boolean;
  isFull: boolean;
  registrations: TournamentDetail["registrations"];
  playersPerGroup: TournamentDetail["playersPerGroup"];
  groupStageTables: TournamentDetail["groupStageTables"];
  groupStageSlots: TournamentDetail["groupStageSlots"];
};

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
  registrations,
  playersPerGroup,
  groupStageTables,
  groupStageSlots,
}: TournamentRegistrationPanelProps) {
  const [selfRegistrationState, setSelfRegistrationState] = useState<SelfTournamentRegistrationState | null>(null);

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

  const hasRegistration = registrationStatus === "CONFIRMED"
    || registrationStatus === "PENDING"
    || registrationStatus === "WAITLIST";

  return (
    <section className="rounded-[1.8rem] border border-[rgba(246,196,79,0.16)] bg-[linear-gradient(180deg,rgba(246,196,79,0.08),rgba(255,255,255,0.03))] p-5">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Registro</p>
      <p className={`mt-4 text-sm leading-7 ${hasRegistration ? "text-emerald-100/88" : "text-white/78"}`}>
        {getRegistrationMessage(registrationStatus, selfRegistrationState?.pendingReason ?? null)}
      </p>
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