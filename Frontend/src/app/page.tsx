import Link from "next/link";
import { getBackendSnapshot } from "@/lib/api/backend";

function getHealthTone(status?: string) {
  if (status === "ok") {
    return "bg-emerald-100 text-emerald-900 border-emerald-200";
  }

  if (status === "degraded") {
    return "bg-amber-100 text-amber-900 border-amber-200";
  }

  return "bg-rose-100 text-rose-900 border-rose-200";
}

export default async function Home() {
  const snapshot = await getBackendSnapshot();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
      <section className="grid flex-1 gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-surface p-8 shadow-[0_24px_80px_rgba(53,34,23,0.12)] backdrop-blur md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(238,198,167,0.5),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.42),transparent_64%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <span className="inline-flex w-fit items-center rounded-full border border-line bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                Billar en Linea
              </span>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                  Frontend listo para empezar y conectado al pulso del backend.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
                  Esta base en Next.js ya consulta la API real, evita el choque con el puerto local del backend y deja una primera pantalla útil para seguir montando autenticación, catálogo y torneos.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
                    href="/login"
                  >
                    Ir al login web
                  </Link>
                  <a
                    className="rounded-full border border-line bg-white/60 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white"
                    href={`${snapshot.apiBaseUrl}/health`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Probar backend
                  </a>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-[1.5rem] border border-line bg-white/70 p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-muted">
                  Frontend
                </p>
                <p className="mt-3 text-2xl font-semibold">Next.js 16</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  App Router, TypeScript y Tailwind listos para iterar.
                </p>
              </article>

              <article className="rounded-[1.5rem] border border-line bg-white/70 p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-muted">
                  API base
                </p>
                <p className="mt-3 break-all text-lg font-semibold">
                  {snapshot.apiBaseUrl}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Configurable con NEXT_PUBLIC_API_BASE_URL.
                </p>
              </article>

              <article className="rounded-[1.5rem] border border-line bg-white/70 p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-muted">
                  Dev local
                </p>
                <p className="mt-3 text-2xl font-semibold">localhost:3000</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  El frontend corre separado del backend en el puerto 3001.
                </p>
              </article>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-5 rounded-[2rem] border border-line bg-[#201815] p-6 text-stone-100 shadow-[0_24px_80px_rgba(24,16,13,0.18)] md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-stone-400">
                Estado backend
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Lectura en vivo</h2>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getHealthTone(
                snapshot.healthData?.status,
              )}`}
            >
              {snapshot.healthData?.status ?? "offline"}
            </span>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-stone-400">Mensaje raíz</p>
              <p className="mt-2 text-lg font-medium text-stone-50">
                {snapshot.rootData?.message ?? "Sin respuesta del backend"}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-stone-400">MongoDB</p>
              <p className="mt-2 text-lg font-medium text-stone-50">
                {snapshot.healthData?.checks?.mongo ?? "desconocido"}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-stone-400">Servicio</p>
              <p className="mt-2 text-lg font-medium text-stone-50">
                {snapshot.healthData?.service ?? "backend no disponible"}
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-black/10 p-5 text-sm leading-7 text-stone-300">
            <p>
              {snapshot.error
                ? `No se pudo conectar con la API: ${snapshot.error}`
                : snapshot.reachable
                  ? `Ultima lectura: ${snapshot.healthData?.timestamp ?? "sin timestamp"}`
                  : "El backend respondió, pero el endpoint raíz no devolvió un estado exitoso."}
            </p>
          </div>

          <div className="grid gap-3 text-sm text-stone-300 sm:grid-cols-2">
            <a
              className="rounded-full border border-white/10 bg-white/8 px-4 py-3 text-center transition hover:bg-white/14"
              href={`${snapshot.apiBaseUrl}/health`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir healthcheck
            </a>
            <a
              className="rounded-full border border-white/10 bg-accent px-4 py-3 text-center font-medium text-white transition hover:bg-accent-strong"
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noreferrer"
            >
              Ver documentación Next
            </a>
          </div>
        </aside>
      </section>
    </main>
  );
}
