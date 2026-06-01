import type { Metadata } from "next";
import Link from "next/link";
import { getJson } from "@/lib/api/client";
import { formatMoney, humanizeToken } from "@/components/content/user/shared";

type WompiOrderReturnItem = {
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type WompiOrderReturnData = {
  payment: {
    reference: string;
    status: string;
    amountInCents: number;
    currency: string;
    transactionId?: string;
    expiresAt?: string;
  };
  order: {
    id: string;
    status: string;
    total: number;
    items: WompiOrderReturnItem[];
    paidAt?: string;
    cancelledAt?: string;
  };
};

type WompiOrderReturnResponse = {
  ok: boolean;
  data?: WompiOrderReturnData;
};

type PageProps = {
  searchParams: Promise<{ reference?: string }>;
};

export const metadata: Metadata = {
  title: "Retorno de pago de pedido",
  robots: { index: false, follow: false },
};

function formatLongDate(value?: string) {
  if (!value) return "Por confirmar";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "full", timeStyle: "short" }).format(parsed);
}

function getStatusCopy(status?: string) {
  switch (status) {
    case "APPROVED":
      return {
        title: "Pedido confirmado",
        description: "Tu pago fue aprobado y el pedido ya quedó en preparación.",
        tone: "border-emerald-400/28 bg-emerald-950/24 text-emerald-50",
      };
    case "PENDING":
      return {
        title: "Pago en proceso",
        description: "Wompi todavía está validando la transacción. Vuelve a revisar en unos minutos.",
        tone: "border-amber-400/28 bg-amber-950/24 text-amber-50",
      };
    default:
      return {
        title: "Pago no confirmado",
        description: "La transacción no quedó aprobada. Puedes intentarlo de nuevo desde la tienda.",
        tone: "border-rose-400/28 bg-rose-950/24 text-rose-50",
      };
  }
}

async function getReturnData(reference?: string): Promise<WompiOrderReturnData | null> {
  if (!reference) return null;
  try {
    const response = await getJson<WompiOrderReturnResponse>(
      `/api/payments/wompi/orders/return?reference=${encodeURIComponent(reference)}`,
      { cache: "no-store" },
    );
    return response.data ?? null;
  } catch {
    return null;
  }
}

export default async function WompiOrderReturnPage({ searchParams }: PageProps) {
  const { reference } = await searchParams;
  const data = await getReturnData(reference);
  const statusCopy = getStatusCopy(data?.payment.status);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] xl:px-10">
      {/* Panel principal */}
      <section className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,14,19,0.98),rgba(14,18,25,0.96))] shadow-[0_28px_100px_rgba(0,0,0,0.34)]">
        <div className="relative flex h-56 items-end border-b border-white/10 bg-[linear-gradient(135deg,rgba(13,110,174,0.22),rgba(246,196,79,0.12),rgba(255,255,255,0.04))] p-5 sm:h-64 sm:p-7">
          <div>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-[rgba(246,196,79,0.82)]">Retorno Wompi · Tienda</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl xl:text-5xl">
              {data ? "Resumen de tu pedido" : "Estamos verificando tu pedido"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/76 sm:text-base">
              {statusCopy.description}
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 xl:p-8">
          {/* Estado del pago */}
          <div className={`rounded-[1.6rem] border p-5 ${statusCopy.tone}`}>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.26em] opacity-80">Estado del pago</p>
            <h2 className="mt-3 text-2xl font-semibold">{statusCopy.title}</h2>
            {data?.payment.status ? (
              <p className="mt-3 text-sm opacity-90">Estado reportado: {humanizeToken(data.payment.status)}</p>
            ) : null}
          </div>

          {data ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[1.45rem] border border-white/8 bg-white/5 p-4 text-white/86">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-white/44">Referencia</p>
                <p className="mt-3 break-all text-sm">{data.payment.reference}</p>
              </article>
              <article className="rounded-[1.45rem] border border-white/8 bg-white/5 p-4 text-white/86">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-white/44">Total</p>
                <p className="mt-3 text-sm">{formatMoney(data.payment.amountInCents / 100)}</p>
              </article>
              <article className="rounded-[1.45rem] border border-white/8 bg-white/5 p-4 text-white/86">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-white/44">Pedido</p>
                <p className="mt-3 text-sm">{humanizeToken(data.order.status)}</p>
              </article>
              <article className="rounded-[1.45rem] border border-white/8 bg-white/5 p-4 text-white/86">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-white/44">
                  {data.order.paidAt ? "Pagado el" : "Fecha de pago"}
                </p>
                <p className="mt-3 text-sm leading-7">{formatLongDate(data.order.paidAt)}</p>
              </article>
            </div>
          ) : (
            <div className="rounded-[1.6rem] border border-white/8 bg-white/5 p-5 text-sm leading-7 text-white/72">
              No fue posible resolver el retorno del pago. Revisa si la URL trae el parámetro reference o vuelve a entrar desde el checkout de Wompi.
            </div>
          )}

          {/* Detalle de ítems del pedido */}
          {data && data.order.items.length > 0 ? (
            <div className="rounded-[1.6rem] border border-white/8 bg-white/4 p-5">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-white/46">Productos del pedido</p>
              <div className="mt-4 grid gap-3">
                {data.order.items.map((item, idx) => (
                  <div
                    key={`${item.productName}-${idx}`}
                    className="flex items-center justify-between gap-4 rounded-[1.1rem] border border-white/8 bg-black/18 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{item.productName}</p>
                      {item.variantName ? (
                        <p className="text-xs text-white/52">{item.variantName}</p>
                      ) : null}
                      <p className="text-xs text-white/52">
                        {item.quantity} × {formatMoney(item.unitPrice)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-white">{formatMoney(item.subtotal)}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-[1.1rem] border border-[rgba(246,196,79,0.2)] bg-[rgba(246,196,79,0.06)] px-4 py-3">
                  <p className="text-sm font-semibold text-white/82">Total del pedido</p>
                  <p className="text-base font-semibold text-[rgba(255,233,174,0.96)]">{formatMoney(data.order.total)}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Panel lateral */}
      <aside className="grid gap-4 self-start">
        <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(246,196,79,0.08),rgba(255,255,255,0.03))] p-5 text-white">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Detalles del pedido</p>
          {data ? (
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-white/44">ID del pedido</p>
                <p className="mt-2 break-all text-sm font-semibold text-white">{data.order.id}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-white/44">Productos</p>
                <p className="mt-2 text-sm font-semibold text-white">{data.order.items.length} referencia{data.order.items.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-white/44">Total</p>
                <p className="mt-2 text-sm font-semibold text-white">{formatMoney(data.order.total)}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/62">Pendiente de confirmación.</p>
          )}
        </section>

        <section className="grid gap-3 rounded-[1.9rem] border border-white/8 bg-white/4 p-5">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-white/46">Acciones</p>
          <Link
            href="/home/tienda"
            className="inline-flex w-full items-center justify-center rounded-[1.1rem] border border-[rgba(246,196,79,0.24)] bg-[rgba(246,196,79,0.1)] px-5 py-3 text-sm font-semibold text-[rgba(255,240,194,0.92)] transition hover:bg-[rgba(246,196,79,0.18)] hover:text-white"
          >
            Seguir comprando
          </Link>
          <Link
            href="/home"
            className="inline-flex w-full items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/82 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
          >
            Ir al inicio
          </Link>
        </section>
      </aside>
    </main>
  );
}
