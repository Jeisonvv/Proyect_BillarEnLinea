"use client";

import { useEffect, useState } from "react";
import { getCurrentSession } from "@/lib/api/auth";
import type { TournamentDetail } from "@/lib/api/public-content";
import { TournamentRegistrationButton } from "./TournamentRegistrationButton";

type TournamentRegistrationPanelProps = {
  tournamentId: string;
  isOpen: boolean;
  isFull: boolean;
  registrations: TournamentDetail["registrations"];
  playersPerGroup: TournamentDetail["playersPerGroup"];
  groupStageTables: TournamentDetail["groupStageTables"];
  groupStageSlots: TournamentDetail["groupStageSlots"];
};

function getRegistrationMessage(status: string | null) {
  if (status === "CONFIRMED") {
    return "Ya estás inscrito en este torneo. Tu cupo ya fue confirmado y no necesitas volver a registrarte.";
  }

  if (status === "PENDING") {
    return "Ya tienes una inscripción creada en este torneo. Tu registro sigue pendiente de confirmación.";
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
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [groupStageSlotId, setGroupStageSlotId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    void getCurrentSession()
      .then((session) => {
        if (!isActive) {
          return;
        }

        const currentUserId = typeof session?.user?.id === "string" ? session.user.id : null;
        const currentRegistration = currentUserId
          ? registrations.find((registration) => registration.user?.id === currentUserId) ?? null
          : null;

        setRegistrationStatus(currentRegistration?.status ?? null);
        setGroupStageSlotId(currentRegistration?.groupStageSlotId ?? null);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setRegistrationStatus(null);
        setGroupStageSlotId(null);
      });

    return () => {
      isActive = false;
    };
  }, [registrations, tournamentId]);

  const hasRegistration = registrationStatus === "CONFIRMED"
    || registrationStatus === "PENDING"
    || registrationStatus === "WAITLIST";

  return (
    <section className="rounded-[1.8rem] border border-[rgba(246,196,79,0.16)] bg-[linear-gradient(180deg,rgba(246,196,79,0.08),rgba(255,255,255,0.03))] p-5">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Registro</p>
      <p className={`mt-4 text-sm leading-7 ${hasRegistration ? "text-emerald-100/88" : "text-white/78"}`}>
        {getRegistrationMessage(registrationStatus)}
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
          initialRegistrationStatus={registrationStatus}
          initialGroupStageSlotId={groupStageSlotId}
        />
      </div>
    </section>
  );
}