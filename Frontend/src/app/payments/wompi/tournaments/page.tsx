import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getJson } from "@/lib/api/client";
import { formatMoney, humanizeToken } from "@/components/content/user/shared";

type WompiTournamentReturnData = {
  payment: {
    reference: string;
    status: string;
    amountInCents: number;
    currency: string;
    redirectUrl?: string;
    expiresAt?: string;
    transactionId?: string;
  };
  registration: {
    id: string;
    status: string;
    playerCategory: string;
    paidAt?: string;
    paymentReference?: string;
  };
  tournament: {
    id: string;
    name: string;
    slug: string;
    status: string;
    entryFee: number;
    startDate?: string;
    imageUrl?: string;
  };
};

type WompiTournamentReturnResponse = {
  ok: boolean;
  data?: WompiTournamentReturnData;
};

type WompiTournamentReturnPageProps = {
  searchParams: Promise<{
    reference?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Retorno de pago de torneo",
  robots: {
    index: false,
    follow: false,
  },
};

function formatLongDate(value?: string) {
  if (!value) {
    return "Por confirmar";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(parsed);
}

function getStatusCopy(status?: string) {
  switch (status) {
    case "APPROVED":
      return {
        title: "Inscripción confirmada",
        description: "Tu pago fue aprobado y el torneo ya quedó asociado a tu inscripción.",
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
        description: "La transacción no quedó aprobada. Puedes intentarlo de nuevo si el cupo sigue disponible.",
        tone: "border-rose-400/28 bg-rose-950/24 text-rose-50",
      };
  }
}

async function getReturnData(reference?: string) {
  if (!reference) {
    return null;
  }

  try {
    const response = await getJson<WompiTournamentReturnResponse>(`/api/payments/wompi/tournaments/return?reference=${encodeURIComponent(reference)}`, {
      cache: "no-store",
    });

    return response.data ?? null;
  } catch {
    return null;
  }
}

export default async function WompiTournamentReturnPage({ searchParams }: WompiTournamentReturnPageProps) {
  const { reference } = await searchParams;
  const data = await getReturnData(reference);
  const statusCopy = getStatusCopy(data?.payment.status);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1280px] gap-6 px-4 py-8 sm:px-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] xl:px-10">
      <section className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,14,19,0.98),rgba(14,18,25,0.96))] shadow-[0_28px_100px_rgba(0,0,0,0.34)]">
        <div className="relative h-[18rem] overflow-hidden border-b border-white/10 bg-black/28 sm:h-[22rem]">
          {data?.tournament.imageUrl ? (
            <Image
              src={data.tournament.imageUrl}
              alt={`Imagen del torneo ${data.tournament.name}`}
              fill
              priority
              sizes="(min-width: 1280px) 55vw, 100vw"
              className="object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(246,196,79,0.18),rgba(13,110,174,0.18),rgba(255,255,255,0.04))]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,14,0.18),rgba(8,10,14,0.34),rgba(8,10,14,0.94))]" />

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-[rgba(246,196,79,0.82)]">Retorno Wompi</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl xl:text-5xl">
              {data?.tournament.name ?? "Estamos verificando tu inscripción"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/76 sm:text-base">
              {statusCopy.description}
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 xl:p-8">
          <div className={`rounded-[1.6rem] border p-5 ${statusCopy.tone}`}>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.26em] opacity-80">Estado del pago</p>
            <h2 className="mt-3 text-2xl font-semibold">{statusCopy.title}</h2>
            {data?.payment.status ? <p className="mt-3 text-sm opacity-90">Estado reportado: {humanizeToken(data.payment.status)}</p> : null}
          </div>

          {data ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[1.45rem] border border-white/8 bg-white/5 p-4 text-white/86">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-white/44">Referencia</p>
                <p className="mt-3 text-sm break-all">{data.payment.reference}</p>
              </article>
              <article className="rounded-[1.45rem] border border-white/8 bg-white/5 p-4 text-white/86">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-white/44">Valor</p>
                <p className="mt-3 text-sm">{formatMoney(data.payment.amountInCents / 100)}</p>
              </article>
              <article className="rounded-[1.45rem] border border-white/8 bg-white/5 p-4 text-white/86">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-white/44">Inicio torneo</p>
                <p className="mt-3 text-sm leading-7">{formatLongDate(data.tournament.startDate)}</p>
              </article>
              <article className="rounded-[1.45rem] border border-white/8 bg-white/5 p-4 text-white/86">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-white/44">Inscripción</p>
                <p className="mt-3 text-sm">{humanizeToken(data.registration.status)}</p>
              </article>
            </div>
          ) : (
            <div className="rounded-[1.6rem] border border-white/8 bg-white/5 p-5 text-sm leading-7 text-white/72">
              No fue posible resolver el retorno del pago. Revisa si la URL trae el parámetro reference o vuelve a entrar desde el checkout de Wompi.
            </div>
          )}
        </div>
      </section>

      <aside className="grid gap-4 self-start">
        <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(246,196,79,0.08),rgba(255,255,255,0.03))] p-5 text-white">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Torneo inscrito</p>
          <h2 className="mt-4 text-2xl font-semibold">{data?.tournament.name ?? "Pendiente de confirmación"}</h2>
          <p className="mt-4 text-sm leading-7 text-white/72">
            Esta vista te muestra a qué torneo quedó asociada la inscripción y en qué estado va el pago de Wompi.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {data?.tournament.slug ? (
              <Link className="inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#0b0b0d] transition hover:bg-accent-strong" href={`/home/torneos/${data.tournament.slug}`}>
                Ir al torneo
              </Link>
            ) : null}
            <Link className="inline-flex rounded-full border border-white/10 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12" href="/home">
              Volver al home
            </Link>
          </div>
        </section>

        <section className="rounded-[1.9rem] border border-white/8 bg-white/5 p-5 text-sm leading-7 text-white/72">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Qué revisar</p>
          <div className="mt-4 grid gap-2">
            <p>1. Si el estado queda en pending, Wompi aún no termina de confirmar la transacción.</p>
            <p>2. Si el estado queda en approved, tu inscripción ya debería aparecer como confirmada.</p>
            <p>3. Si el estado es declined, voided, error o expired, puedes intentar el pago otra vez desde la página del torneo.</p>
          </div>
        </section>
      </aside>
    </main>
  );
}