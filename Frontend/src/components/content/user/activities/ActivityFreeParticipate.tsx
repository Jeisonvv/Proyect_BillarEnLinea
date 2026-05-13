"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ApiError, postJson } from "@/lib/api/client";
import type { ActivityDetail } from "@/lib/api/public-content";
import type { MyActivityNumber } from "@/lib/api/public-content/activities";
import { AuthPromptModal } from "@/components/content/user/shared";

type FreeTicketResponse = {
  ok: boolean;
  message?: string;
  data?: {
    numbers?: string[];
  };
};

type Phase = "idle" | "rolling" | "revealed" | "error";

type ActivityFreeParticipateProps = {
  activity: ActivityDetail;
  myNumbers?: MyActivityNumber[];
};

function pad(value: number, width: number) {
  return String(value).padStart(width, "0");
}

export function ActivityFreeParticipate({ activity, myNumbers = [] }: ActivityFreeParticipateProps) {
  const router = useRouter();

  // Si el usuario ya tiene un número en esta rifa, lo mostramos como ya participado
  const existingNumber = useMemo(() => {
    const owned = myNumbers.find((n) => n.status === "PAID" || n.status === "WINNER");
    return owned?.number ?? null;
  }, [myNumbers]);

  const [phase, setPhase] = useState<Phase>(existingNumber ? "revealed" : "idle");
  const [displayNumber, setDisplayNumber] = useState<string>(existingNumber ?? "");
  const [finalNumber, setFinalNumber] = useState<string | null>(existingNumber);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalTickets = activity.totalTickets ?? 100;
  const numberWidth = String(Math.max(0, totalTickets - 1)).length;
  const isActive = activity.status === "ACTIVE";
  const alreadyParticipated = existingNumber !== null;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startRollingAnimation() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const random = Math.floor(Math.random() * totalTickets);
      setDisplayNumber(pad(random, numberWidth));
    }, 60);
  }

  function stopRollingAnimation(finalValue: string) {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Slow-down effect: animate a few more iterations before settling
    let step = 0;
    const slowDown = setInterval(() => {
      step += 1;
      const random = Math.floor(Math.random() * totalTickets);
      setDisplayNumber(pad(random, numberWidth));
      if (step >= 6) {
        clearInterval(slowDown);
        setDisplayNumber(finalValue);
        setFinalNumber(finalValue);
        setPhase("revealed");
        router.refresh();
      }
    }, 130);
  }

  async function handleParticipate() {
    if (!isActive || phase === "rolling") return;

    setPhase("rolling");
    setFinalNumber(null);
    setErrorMessage(null);
    setDisplayNumber(pad(0, numberWidth));
    startRollingAnimation();

    try {
      // Aseguramos al menos ~1.2s de animación
      const minimumDelay = new Promise<void>((resolve) => setTimeout(resolve, 1200));
      const requestPromise = postJson<FreeTicketResponse, { channel: string }>(
        `/api/activities/${encodeURIComponent(activity.id)}/tickets`,
        { channel: "WEB" },
        { credentials: "include" },
      );

      const [response] = await Promise.all([requestPromise, minimumDelay]);
      const assignedNumber = response.data?.numbers?.[0];

      if (!assignedNumber) {
        throw new Error("No se recibió un número asignado.");
      }

      stopRollingAnimation(assignedNumber);
    } catch (error) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (error instanceof ApiError && error.status === 401) {
        setPhase("idle");
        setDisplayNumber("");
        setShowAuthPrompt(true);
        return;
      }
      const message = error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "No fue posible registrar tu participación.";
      setErrorMessage(message);
      setPhase("error");
    }
  }

  function reset() {
    setPhase("idle");
    setDisplayNumber("");
    setFinalNumber(null);
    setErrorMessage(null);
  }

  return (
    <>
    <section className="grid gap-6 rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,18,24,0.96),rgba(9,11,16,0.98))] p-5 sm:p-7">
      <header className="grid gap-2 text-center">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.82)]">
          Actividad gratuita
        </p>
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">
          {phase === "revealed"
            ? alreadyParticipated
              ? "¡Ya estás participando!"
              : "¡Tu número de la suerte!"
            : "Participa en un giro"}
        </h2>
        <p className="mx-auto max-w-xl text-sm leading-7 text-white/68">
          {phase === "revealed"
            ? "Guarda este número. Si coincide con el número ganador del sorteo, ¡eres el afortunado!"
            : "Esta actividad es gratuita. Al presionar Participar, el sistema te asignará un número al azar."}
        </p>
      </header>

      {/* Slot machine display */}
      <div className="mx-auto grid w-full max-w-md gap-4">
        <div className="relative overflow-hidden rounded-[1.6rem] border border-amber-300/30 bg-[linear-gradient(180deg,rgba(28,22,10,0.95),rgba(13,10,4,0.95))] p-6 shadow-[inset_0_2px_24px_rgba(246,196,79,0.18),0_18px_40px_rgba(0,0,0,0.5)] sm:p-8">
          <div
            className={`pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0)_30%,rgba(255,255,255,0)_70%,rgba(0,0,0,0.35))] ${phase === "rolling" ? "opacity-90" : "opacity-60"}`}
            aria-hidden
          />

          <div className="relative flex items-center justify-center gap-2 text-center">
            {(displayNumber || pad(0, numberWidth)).split("").map((digit, idx) => (
              <span
                key={`${idx}-${digit}`}
                className={`inline-flex h-20 min-w-14 items-center justify-center rounded-xl border border-amber-300/30 bg-black/60 font-mono text-4xl font-bold tabular-nums sm:h-24 sm:min-w-16 sm:text-5xl ${
                  phase === "revealed"
                    ? "text-[#f6c44f] shadow-[0_0_24px_rgba(246,196,79,0.5)] animate-[pulse_1s_ease-in-out_infinite]"
                    : phase === "rolling"
                      ? "text-amber-100/90"
                      : "text-white/40"
                }`}
              >
                {digit}
              </span>
            ))}
          </div>

          {phase === "revealed" ? (
            <p className="relative mt-5 text-center font-mono text-[0.68rem] uppercase tracking-[0.32em] text-[rgba(246,196,79,0.86)]">
              Número asignado
            </p>
          ) : phase === "rolling" ? (
            <p className="relative mt-5 text-center text-xs text-white/55 animate-pulse">
              Sorteando tu número…
            </p>
          ) : (
            <p className="relative mt-5 text-center text-xs text-white/45">
              Presiona Participar para girar
            </p>
          )}
        </div>

        {alreadyParticipated ? (
          <div className="grid gap-2">
            <p className="rounded-2xl border border-emerald-300/24 bg-emerald-400/10 px-4 py-3 text-center text-sm text-emerald-100">
              ✓ Ya estás participando con el número{" "}
              <strong className="font-mono text-base text-emerald-50">{existingNumber}</strong>.
            </p>
            <p className="text-center text-xs text-white/55">
              Solo se permite una participación por persona en esta actividad gratuita.
            </p>
          </div>
        ) : phase === "idle" || phase === "error" ? (
          <button
            type="button"
            onClick={handleParticipate}
            disabled={!isActive}
            className="w-full rounded-full bg-[linear-gradient(135deg,#f6c44f,#e0a936)] px-6 py-3.5 text-base font-semibold text-[#1c160a] shadow-[0_10px_30px_rgba(246,196,79,0.3)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isActive ? "🎲 Participar" : "Venta no disponible"}
          </button>
        ) : phase === "rolling" ? (
          <button
            type="button"
            disabled
            className="w-full rounded-full bg-white/8 px-6 py-3.5 text-base font-semibold text-white/65"
          >
            Asignando número…
          </button>
        ) : (
          <div className="grid gap-2">
            <p className="rounded-2xl border border-emerald-300/24 bg-emerald-400/10 px-4 py-3 text-center text-sm text-emerald-100">
              ✓ Participación registrada{finalNumber ? ` con el número ${finalNumber}` : ""}.
            </p>
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-full border border-white/14 bg-white/4 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/8"
            >
              Cerrar
            </button>
          </div>
        )}

        {errorMessage ? (
          <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-100">
            {errorMessage}
          </p>
        ) : null}

        {phase === "revealed" && finalNumber ? (
          <ShareActivity activity={activity} myNumber={finalNumber} />
        ) : null}
      </div>

      {!isActive ? (
        <p className="rounded-2xl border border-amber-300/24 bg-amber-400/10 px-4 py-3 text-center text-sm text-amber-100">
          La actividad no está activa para participar.
        </p>
      ) : null}
    </section>
    <AuthPromptModal
      open={showAuthPrompt}
      onClose={() => setShowAuthPrompt(false)}
      title="Necesitas una cuenta para participar"
      description="Para participar en esta actividad gratuita debes iniciar sesión o crear una cuenta. Así guardamos tu número asignado y podemos avisarte si resultas ganador."
      dismissLabel="Seguir viendo la actividad"
      redirectTo={`/home/activities/${activity.slug ?? activity.id}`}
    />
    </>
  );
}

type ShareActivityProps = {
  activity: ActivityDetail;
  myNumber: string;
};

// Suscripción no-op: el origin del navegador no cambia mientras el componente
// está montado, así que no necesitamos notificar cambios. Solo nos interesa que
// React lea el valor en el cliente y devuelva "" en SSR para evitar mismatches.
function subscribeNoop() {
  return () => {};
}

function ShareActivity({ activity, myNumber }: ShareActivityProps) {
  const [copied, setCopied] = useState(false);
  const origin = useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => "",
  );
  const shareUrl = origin
    ? `${origin}/home/activities/${activity.slug ?? activity.id}`
    : `/home/activities/${activity.slug ?? activity.id}`;

  const shareText = useMemo(() => {
    const prize = activity.prize ? ` Puedes ganar: ${activity.prize}.` : "";
    return `🎰 Estoy participando en la actividad gratuita "${activity.name}" en Billar en Línea con el número ${myNumber}.${prize} ¡Participa tú también, no te la pierdas! 🎲`;
  }, [activity.name, activity.prize, myNumber]);

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;

  async function handleInstagramShare() {
    // Instagram no tiene URL de compartir web. Copiamos el texto y abrimos Instagram.
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/4 p-4">
      <div className="text-center">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.82)]">
          Comparte
        </p>
        <h3 className="mt-1 text-base font-semibold text-white">
          Comparte esta actividad para que ninguno de tus amigos se la pierda
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-3 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-500/20"
          aria-label="Compartir en WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.04 21.785h-.003a9.87 9.87 0 01-5.031-1.378l-.36-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.81 9.81 0 016.988 2.898 9.825 9.825 0 012.896 6.994c-.003 5.45-4.437 9.884-9.892 9.884zm8.413-18.297A11.815 11.815 0 0012.04 0C5.463 0 .104 5.359.101 11.94a11.93 11.93 0 001.594 5.945L0 24l6.255-1.64a11.92 11.92 0 005.785 1.473h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.485-8.413z"/>
          </svg>
          WhatsApp
        </a>

        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-blue-400/30 bg-blue-500/10 px-3 py-3 text-xs font-semibold text-blue-50 transition hover:bg-blue-500/20"
          aria-label="Compartir en Facebook"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
            <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073C0 18.062 4.388 23.027 10.125 23.927v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </a>

        <button
          type="button"
          onClick={handleInstagramShare}
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-pink-400/30 bg-linear-to-br from-fuchsia-500/15 via-pink-500/15 to-amber-500/15 px-3 py-3 text-xs font-semibold text-pink-50 transition hover:brightness-110"
          aria-label="Compartir en Instagram"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
          Instagram
        </button>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full border border-white/14 bg-white/4 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/8"
      >
        {copied ? "✓ Copiado al portapapeles" : "Copiar enlace y mensaje"}
      </button>
    </div>
  );
}
