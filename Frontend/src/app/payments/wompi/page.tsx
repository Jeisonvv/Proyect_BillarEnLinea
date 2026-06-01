import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Verificando pago",
  robots: { index: false, follow: false },
};

export default function WompiGenericReturnPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-16 text-center sm:px-6">
      <div className="w-full overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,14,19,0.98),rgba(14,18,25,0.96))] p-8 shadow-[0_28px_100px_rgba(0,0,0,0.34)] sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.4rem] border border-[rgba(246,196,79,0.28)] bg-[rgba(246,196,79,0.1)]">
          <svg
            aria-hidden="true"
            className="h-9 w-9 text-[rgba(246,196,79,0.9)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>

        <p className="mt-6 font-mono text-[0.72rem] uppercase tracking-[0.32em] text-[rgba(246,196,79,0.76)]">Retorno Wompi</p>
        <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Pago procesado</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/68 sm:text-base">
          Tu transacción fue recibida. Si realizaste un pago de torneo o actividad, visita la sección correspondiente para ver el estado actualizado.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/home/torneos"
            className="inline-flex w-full items-center justify-center rounded-[1.1rem] border border-[rgba(246,196,79,0.24)] bg-[rgba(246,196,79,0.1)] px-5 py-3 text-sm font-semibold text-[rgba(255,240,194,0.92)] transition hover:bg-[rgba(246,196,79,0.18)] hover:text-white"
          >
            Ver torneos
          </Link>
          <Link
            href="/home/activities"
            className="inline-flex w-full items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/82 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
          >
            Ver actividades
          </Link>
          <Link
            href="/home/tienda"
            className="inline-flex w-full items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/82 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
          >
            Ir a la tienda
          </Link>
          <Link
            href="/home"
            className="inline-flex w-full items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/82 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
