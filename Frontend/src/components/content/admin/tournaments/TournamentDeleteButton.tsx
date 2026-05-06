"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteTournamentAdmin } from "@/lib/api/admin-tournaments";

type FeedbackState = {
  kind: "idle" | "success" | "error";
  message?: string;
};

type TournamentDeleteButtonProps = {
  tournamentId: string;
  tournamentName: string;
  redirectTo?: string;
  variant?: "pill" | "text";
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible completar la operación.";
}

export function TournamentDeleteButton({
  tournamentId,
  tournamentName,
  redirectTo,
  variant = "pill",
}: TournamentDeleteButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setFeedback({ kind: "idle" });
    setIsOpen(true);
  }

  function handleClose() {
    if (isPending) {
      return;
    }

    setIsOpen(false);
  }

  function handleDelete() {
    setFeedback({ kind: "idle" });

    startTransition(async () => {
      try {
        const response = await deleteTournamentAdmin(tournamentId);
        setFeedback({
          kind: "success",
          message: response.message ?? "Torneo eliminado correctamente.",
        });
        setIsOpen(false);

        if (redirectTo) {
          router.replace(redirectTo);
        }

        router.refresh();
      } catch (error) {
        setFeedback({ kind: "error", message: getErrorMessage(error) });
      }
    });
  }

  return (
    <>
      <div className="grid gap-2">
        <button
          className={variant === "text"
            ? "text-sm font-semibold text-rose-200 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
            : "inline-flex items-center justify-center rounded-full border border-rose-400/28 bg-rose-500/12 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/18 disabled:cursor-not-allowed disabled:opacity-70"
          }
          disabled={isPending}
          onClick={handleOpen}
          type="button"
        >
          {isPending ? "Eliminando..." : "Eliminar torneo"}
        </button>

        {feedback.kind !== "idle" ? (
          <p className={feedback.kind === "error" ? "text-sm text-rose-300" : "text-sm text-emerald-300"}>{feedback.message}</p>
        ) : null}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <button
            aria-label="Cerrar confirmación"
            className="absolute inset-0 bg-[rgba(6,8,12,0.82)] backdrop-blur-sm"
            disabled={isPending}
            onClick={handleClose}
            type="button"
          />

          <section className="relative z-10 w-full max-w-xl overflow-hidden rounded-[2rem] border border-rose-400/18 bg-[linear-gradient(180deg,rgba(22,12,16,0.98),rgba(14,10,14,0.97))] shadow-[0_30px_90px_rgba(0,0,0,0.48)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(248,113,113,0.18),transparent_34%),linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.03)_46%,transparent_72%)]" />
            <div className="relative grid gap-6 p-6 sm:p-7">
              <div className="space-y-3">
                <p className="text-[0.72rem] uppercase tracking-[0.32em] text-rose-200/88">Zona destructiva</p>
                <h3 className="text-2xl font-semibold text-white">Eliminar torneo</h3>
                <p className="text-sm leading-7 text-white/72">
                  Vas a eliminar <span className="font-semibold text-white">{tournamentName}</span>. Esta acción borrará también sus grupos,
                  inscripciones, partidos y transacciones asociadas. No se puede deshacer.
                </p>
              </div>

              <div className="grid gap-3 rounded-[1.4rem] border border-white/8 bg-black/18 p-4 text-sm text-white/68">
                <p>Se eliminarán los datos operativos y competitivos vinculados a este torneo.</p>
                <p>Los jugadores inscritos dejarán de aparecer en el panel y en el detalle público.</p>
                <p>Los pagos asociados a inscripciones del torneo también serán removidos.</p>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white/82 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isPending}
                  onClick={handleClose}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isPending}
                  onClick={handleDelete}
                  type="button"
                >
                  {isPending ? "Eliminando torneo..." : "Sí, eliminar torneo"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}