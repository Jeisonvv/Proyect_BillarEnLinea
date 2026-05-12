"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, ApiError, postJson } from "@/lib/api/client";
import type { ActivityDetail } from "@/lib/api/public-content";
import type { MyActivityNumber, ActivityNumberItem } from "@/lib/api/public-content/activities";
import { AuthPromptModal, ConfirmModal } from "@/components/content/user/shared";
import { formatMoney } from "../shared/utils";

type WompiCheckoutConfig = {
  checkoutUrl?: string;
  publicKey?: string;
  currency?: string;
  amountInCents?: number;
  reference?: string;
  redirectUrl?: string;
  expirationTime?: string;
  signature?: { integrity?: string };
  customerData?: {
    email?: string;
    fullName?: string;
    phoneNumberPrefix?: string;
    phoneNumber?: string;
  };
};

type CheckoutResponse = {
  ok: boolean;
  data?: WompiCheckoutConfig;
  message?: string;
};

type FreeTicketResponse = {
  ok: boolean;
  message?: string;
};

function buildWompiCheckoutUrl(config: WompiCheckoutConfig): string | null {
  if (!config.checkoutUrl || !config.publicKey || !config.currency || !config.amountInCents || !config.reference) {
    return null;
  }

  const params = new URLSearchParams({
    "public-key": config.publicKey,
    currency: config.currency,
    "amount-in-cents": String(config.amountInCents),
    reference: config.reference,
  });

  if (config.redirectUrl) params.set("redirect-url", config.redirectUrl);
  if (config.expirationTime) params.set("expiration-time", config.expirationTime);
  if (config.signature?.integrity) params.set("signature:integrity", config.signature.integrity);
  if (config.customerData?.email) params.set("customer-data:email", config.customerData.email);
  if (config.customerData?.fullName) params.set("customer-data:full-name", config.customerData.fullName);
  if (config.customerData?.phoneNumberPrefix) {
    params.set("customer-data:phone-number-prefix", config.customerData.phoneNumberPrefix);
  }
  if (config.customerData?.phoneNumber) {
    params.set("customer-data:phone-number", config.customerData.phoneNumber);
  }

  return `${config.checkoutUrl}?${params.toString()}`;
}

function getNumberClass(state: "available" | "selected" | "sold" | "mine-pending" | "mine-paid") {
  switch (state) {
    case "selected":
      return "border-amber-300/70 bg-[linear-gradient(135deg,#f6c44f,#e0a936)] text-[#1c160a] shadow-[0_8px_18px_rgba(246,196,79,0.32)]";
    case "mine-pending":
      return "border-sky-300/60 bg-[linear-gradient(135deg,#0ea5e9,#0369a1)] text-white shadow-[0_8px_18px_rgba(14,165,233,0.28)] hover:brightness-110 ring-1 ring-sky-200/30";
    case "mine-paid":
      return "border-violet-300/40 bg-[linear-gradient(135deg,#7c3aed,#5b21b6)] text-white shadow-[0_8px_18px_rgba(124,58,237,0.28)] cursor-default";
    case "sold":
      return "border-rose-400/30 bg-[linear-gradient(135deg,#b91c1c,#7f1d1d)] text-white/90 cursor-not-allowed";
    case "available":
    default:
      return "border-emerald-300/30 bg-[linear-gradient(135deg,#15803d,#0f5132)] text-emerald-50 hover:border-emerald-200 hover:brightness-110";
  }
}

type ActivityNumberGridProps = {
  activity: ActivityDetail;
  initialNumbers: ActivityNumberItem[];
  myNumbers?: MyActivityNumber[];
};

export function ActivityNumberGrid({ activity, initialNumbers, myNumbers = [] }: ActivityNumberGridProps) {
  const router = useRouter();
  const [numbers, setNumbers] = useState<ActivityNumberItem[]>(initialNumbers);
  const myPendingSet = useMemo(
    () => new Set(myNumbers.filter((n) => n.status === "RESERVED").map((n) => n.number)),
    [myNumbers],
  );
  const myPaidSet = useMemo(
    () => new Set(myNumbers.filter((n) => n.status === "PAID" || n.status === "WINNER").map((n) => n.number)),
    [myNumbers],
  );
  // Pre-seleccionar las reservas pendientes para que el usuario las pueda reintentar pagar
  const [selected, setSelected] = useState<Set<string>>(() => new Set(myPendingSet));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [pendingRelease, setPendingRelease] = useState<string[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const isFree = activity.isFree === true || activity.ticketPrice === 0;
  const isActive = activity.status === "ACTIVE";
  const ticketPrice = activity.ticketPrice ?? 0;
  const totalAmount = ticketPrice * selected.size;

  const stats = useMemo(() => {
    let available = 0;
    let sold = 0;
    for (const n of numbers) {
      if (n.status === "AVAILABLE") available++;
      else sold++;
    }
    return { available, sold, total: numbers.length };
  }, [numbers]);

  function toggleNumber(item: ActivityNumberItem) {
    if (!isActive) return;
    const isMinePending = myPendingSet.has(item.number);
    if (item.status !== "AVAILABLE" && !isMinePending) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item.number)) next.delete(item.number);
      else next.add(item.number);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
    setFeedback(null);
  }

  async function refreshNumbers() {
    try {
      const res = await fetch(`/api/activities/${encodeURIComponent(activity.id)}/numbers?limit=1000`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json?.data?.numbers && Array.isArray(json.data.numbers)) {
        const fresh: ActivityNumberItem[] = json.data.numbers
          .filter((n: unknown): n is { number: string; numericValue: number; status: string } =>
            typeof n === "object" && n !== null && "number" in n && "status" in n,
          )
          .map((n: { number: string; numericValue: number; status: string }) => ({
            number: String(n.number),
            numericValue: Number(n.numericValue),
            status: n.status as ActivityNumberItem["status"],
          }));
        setNumbers(fresh);
      }
    } catch {
      // ignore
    }
  }

  function handlePurchase() {
    if (selected.size === 0 || !isActive) return;
    setFeedback(null);

    const selectedArray = Array.from(selected);

    startTransition(async () => {
      try {
        if (isFree) {
          const response = await postJson<FreeTicketResponse, { numbers: string[]; channel: string }>(
            `/api/activities/${encodeURIComponent(activity.id)}/tickets`,
            { numbers: selectedArray, channel: "WEB" },
            { credentials: "include" },
          );
          setFeedback(response.message ?? "¡Boletos reservados con éxito!");
          setSelected(new Set());
          await refreshNumbers();
          router.refresh();
          return;
        }

        const response = await postJson<CheckoutResponse, { numbers: string[]; channel: string }>(
          `/api/activities/${encodeURIComponent(activity.id)}/wompi/checkout`,
          { numbers: selectedArray, channel: "WEB" },
          { credentials: "include" },
        );

        const wompiUrl = buildWompiCheckoutUrl(response.data ?? {});
        if (!wompiUrl) {
          setFeedback("No se pudo preparar la pasarela de pago. Intenta nuevamente.");
          await refreshNumbers();
          return;
        }

        window.location.assign(wompiUrl);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setShowAuthPrompt(true);
          return;
        }
        const message = error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "No fue posible completar la compra.";
        setFeedback(message);
        await refreshNumbers();
      }
    });
  }

  function handleReleaseReservations(numbersToRelease?: string[]) {
    if (myPendingSet.size === 0) return;
    const target = numbersToRelease && numbersToRelease.length > 0
      ? numbersToRelease
      : Array.from(myPendingSet);
    setPendingRelease(target);
  }

  function confirmReleaseReservations() {
    const target = pendingRelease;
    if (!target || target.length === 0) {
      setPendingRelease(null);
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/activities/${encodeURIComponent(activity.id)}/my-numbers`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({ numbers: target }),
        });

        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          if (res.status === 401) {
            setShowAuthPrompt(true);
            return;
          }
          const message = (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string")
            ? payload.message
            : "No fue posible liberar los números.";
          setFeedback(message);
          return;
        }

        // Limpiar selección de los liberados
        setSelected((prev) => {
          const next = new Set(prev);
          for (const n of target) next.delete(n);
          return next;
        });
        setFeedback(`Liberaste ${target.length} número(s). Ya están disponibles para otros usuarios.`);
        await refreshNumbers();
        router.refresh();
      } catch {
        setFeedback("No fue posible liberar los números.");
      } finally {
        setPendingRelease(null);
      }
    });
  }

  return (
    <>
    <section className="grid gap-5 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,18,24,0.96),rgba(9,11,16,0.98))] p-5 sm:p-7">
      <header className="grid gap-3 sm:flex sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.82)]">
            Selecciona tus números
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Grilla de boletos</h2>
          <p className="mt-2 text-xs text-white/60">
            Toca los números que quieres comprar. Puedes seleccionar varios a la vez.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-emerald-100">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Disponibles {stats.available}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-amber-100">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" /> Seleccionados {selected.size}
          </span>
          {myPendingSet.size > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/40 bg-sky-400/10 px-3 py-1 text-sky-100">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> Tu reserva pendiente {myPendingSet.size}
            </span>
          ) : null}
          {myPaidSet.size > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/40 bg-violet-400/10 px-3 py-1 text-violet-100">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-400" /> Tus boletos {myPaidSet.size}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-rose-100">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Vendidos {stats.sold}
          </span>
        </div>
      </header>

      {numbers.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/4 p-6 text-center text-sm text-white/60">
          Aún no hay números disponibles para esta actividad.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div
            className="grid gap-1.5 sm:gap-2"
            style={{ gridTemplateColumns: "repeat(10, minmax(2.4rem, 1fr))" }}
          >
            {numbers.map((item) => {
              const isSelected = selected.has(item.number);
              const isMinePending = myPendingSet.has(item.number);
              const isMinePaid = myPaidSet.has(item.number);
              const state = isSelected
                ? "selected"
                : isMinePaid
                  ? "mine-paid"
                  : isMinePending
                    ? "mine-pending"
                    : item.status === "AVAILABLE"
                      ? "available"
                      : "sold";
              const disabled = !isActive || (item.status !== "AVAILABLE" && !isMinePending);
              const title = isMinePaid
                ? `Número ${item.number} — ya es tuyo`
                : isMinePending
                  ? `Número ${item.number} — reserva pendiente, públicalo para reintentar el pago`
                  : item.status === "AVAILABLE"
                    ? `Número ${item.number} disponible`
                    : `Número ${item.number} no disponible`;
              return (
                <button
                  type="button"
                  key={item.number}
                  onClick={() => toggleNumber(item)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className={`flex aspect-square items-center justify-center rounded-md border font-mono text-[0.78rem] font-semibold transition sm:text-sm ${getNumberClass(state)}`}
                  title={title}
                >
                  {item.number}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {myPendingSet.size > 0 ? (
        <div className="grid gap-3 rounded-2xl border border-sky-300/24 bg-sky-400/10 px-4 py-3 text-sm text-sky-100 sm:flex sm:items-center sm:justify-between">
          <p className="text-sky-100">
            Tienes <strong>{myPendingSet.size}</strong> número(s) reservado(s) pendientes de pago. Quedaron pre-seleccionados; presiona <strong>Reintentar pago</strong> para continuar con Wompi, o libéralos si ya no los quieres.
          </p>
          <button
            type="button"
            onClick={() => handleReleaseReservations()}
            disabled={isPending}
            className="shrink-0 rounded-full border border-sky-200/40 bg-sky-500/20 px-4 py-2 text-xs font-semibold text-sky-50 transition hover:bg-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Liberar reservas
          </button>
        </div>
      ) : null}

      <footer className="grid gap-4 rounded-[1.4rem] border border-white/10 bg-white/4 p-4 sm:flex sm:items-center sm:justify-between">
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-[0.18em] text-white/55">Resumen</p>
          <p className="text-sm text-white/82">
            <span className="font-semibold text-white">{selected.size}</span> boleto(s) ·{" "}
            <span className="font-semibold text-white">
              {isFree ? "Gratis" : formatMoney(totalAmount)}
            </span>
          </p>
          {selected.size > 0 ? (
            <p className="text-xs text-white/55">
              {Array.from(selected).sort().join(", ")}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selected.size > 0 ? (
            <button
              type="button"
              onClick={clearSelection}
              disabled={isPending}
              className="rounded-full border border-white/14 bg-white/4 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/8 disabled:opacity-50"
            >
              Limpiar
            </button>
          ) : null}
          <button
            type="button"
            onClick={handlePurchase}
            disabled={selected.size === 0 || !isActive || isPending}
            className="rounded-full bg-[linear-gradient(135deg,#f6c44f,#e0a936)] px-5 py-2.5 text-sm font-semibold text-[#1c160a] shadow-[0_8px_24px_rgba(246,196,79,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isPending
              ? "Procesando..."
              : isFree
                ? "Reservar boletos"
                : selected.size > 0 && Array.from(selected).every((n) => myPendingSet.has(n))
                  ? `Reintentar pago (${formatMoney(totalAmount)})`
                  : `Comprar ${selected.size > 0 ? `(${formatMoney(totalAmount)})` : "boletos"}`}
          </button>
        </div>
      </footer>

      {feedback ? (
        <p className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white/82">
          {feedback}
        </p>
      ) : null}

      {!isActive ? (
        <p className="rounded-2xl border border-amber-300/24 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          La venta de boletos no está abierta en este momento.
        </p>
      ) : null}
    </section>
    <AuthPromptModal
      open={showAuthPrompt}
      onClose={() => setShowAuthPrompt(false)}
      title="Necesitas una cuenta para participar"
      description="Para reservar o comprar números de esta actividad debes iniciar sesión o crear una cuenta. Así podemos guardar tu reserva, tu pago y avisarte si ganas."
      dismissLabel="Seguir viendo la actividad"
      redirectTo={`/home/activities/${activity.id}`}
    />
    <ConfirmModal
      open={pendingRelease !== null}
      onClose={() => { if (!isPending) setPendingRelease(null); }}
      onConfirm={confirmReleaseReservations}
      eyebrow="Liberar reservas"
      title={`¿Liberar ${pendingRelease?.length ?? 0} número(s)?`}
      description="Estos números volverán a quedar disponibles para que otros usuarios puedan comprarlos. Esta acción no se puede deshacer."
      confirmLabel={isPending ? "Liberando..." : "Sí, liberar"}
      cancelLabel="Cancelar"
      tone="danger"
      disabled={isPending}
    />
    </>
  );
}
