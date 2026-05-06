import Link from "next/link";
import { AdminSectionScaffold, formatAdminDate, formatAdminMoney, humanizeAdminToken } from "@/components/content/admin/shared/AdminSectionScaffold";
import { getLandingSnapshot } from "@/lib/api/public-content";

export default async function AdminTournamentsPage() {
  const snapshot = await getLandingSnapshot();
  const tournaments = snapshot.tournaments.items;
  const openCount = tournaments.filter((item) => item.status === "OPEN").length;

  return (
    <AdminSectionScaffold
      kicker="Admin torneos"
      title="Gestiona la agenda competitiva"
      description="Revisa el estado de los torneos publicados, entra a la vista pública y abre el laboratorio para crear nuevos torneos desde el contexto administrativo."
      primaryAction={{ label: "Crear torneo", href: "/admin/torneos/crear" }}
      secondaryAction={{ label: "Home user", href: "/home" }}
      metrics={[
        { label: "Total", value: String(snapshot.totals.tournaments), helper: snapshot.tournaments.error ?? "Torneos visibles en el snapshot actual." },
        { label: "Abiertos", value: String(openCount), helper: "Con inscripciones activas en este momento." },
        { label: "Muestra", value: String(tournaments.length), helper: "Elementos cargados en esta vista administrativa." },
      ]}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Torneos recientes</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Panel de seguimiento</h2>
        </div>
        <Link className="text-sm font-medium text-white/62 transition hover:text-white" href="/home/torneos">
          Ver vista usuario
        </Link>
      </div>

      <div className="grid gap-4">
        {tournaments.length > 0 ? tournaments.map((tournament) => (
          <article key={tournament.id} className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xl font-semibold text-white">{tournament.name}</p>
                <p className="text-sm leading-7 text-white/64">Inicio: {formatAdminDate(tournament.startDate)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/78">{humanizeAdminToken(tournament.format)}</span>
                <span className="rounded-full border border-[rgba(246,196,79,0.2)] bg-[rgba(246,196,79,0.12)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(255,233,174,0.96)]">{humanizeAdminToken(tournament.status)}</span>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Inscripción</p>
                <p className="mt-2 text-base font-semibold text-white">{formatAdminMoney(tournament.entryFee)}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Cupos</p>
                <p className="mt-2 text-base font-semibold text-white">{tournament.maxParticipants ?? "Por definir"}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Acción</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <Link className="text-sm font-semibold text-[#f6c44f] transition hover:text-white" href="/home/torneos">Ir al listado</Link>
                  <Link className="text-sm font-semibold text-white/72 transition hover:text-white" href={`/home/torneos/${tournament.slug}`}>Abrir detalle</Link>
                </div>
              </div>
            </div>
          </article>
        )) : (
          <p className="rounded-[1.3rem] border border-dashed border-white/10 bg-black/12 px-4 py-4 text-sm leading-7 text-white/62">No hay torneos cargados todavía.</p>
        )}
      </div>
    </AdminSectionScaffold>
  );
}