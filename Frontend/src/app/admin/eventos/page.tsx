import Link from "next/link";
import { AdminSectionScaffold, formatAdminDate, formatAdminMoney, humanizeAdminToken } from "@/components/content/admin/shared/AdminSectionScaffold";
import { getLandingSnapshot } from "@/lib/api/public-content";

export default async function AdminEventsPage() {
  const snapshot = await getLandingSnapshot();
  const events = snapshot.events.items;
  const scheduledCount = events.filter((item) => item.status === "SCHEDULED").length;

  return (
    <AdminSectionScaffold
      kicker="Admin eventos"
      title="Centraliza el calendario del club"
      description="Controla los eventos visibles, detecta programación pendiente y entra rápido a la vista pública para revisar cómo se está mostrando el calendario al usuario."
      primaryAction={{ label: "Dashboard", href: "/admin" }}
      secondaryAction={{ label: "Home user", href: "/home" }}
      metrics={[
        { label: "Total", value: String(snapshot.totals.events), helper: snapshot.events.error ?? "Eventos visibles en el snapshot actual." },
        { label: "Programados", value: String(scheduledCount), helper: "Eventos con estado scheduled en esta muestra." },
        { label: "Muestra", value: String(events.length), helper: "Elementos revisados en esta sección administrativa." },
      ]}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Eventos recientes</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Monitoreo operativo</h2>
        </div>
        <Link className="text-sm font-medium text-white/62 transition hover:text-white" href="/home/eventos">
          Ver vista usuario
        </Link>
      </div>

      <div className="grid gap-4">
        {events.length > 0 ? events.map((event) => (
          <article key={event.id} className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xl font-semibold text-white">{event.name}</p>
                <p className="text-sm leading-7 text-white/64">Inicio: {formatAdminDate(event.startDate)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/78">{humanizeAdminToken(event.type)}</span>
                <span className="rounded-full border border-[rgba(132,224,196,0.22)] bg-[rgba(132,224,196,0.12)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(214,255,243,0.96)]">{humanizeAdminToken(event.status)}</span>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Tier</p>
                <p className="mt-2 text-base font-semibold text-white">{humanizeAdminToken(event.tier)}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Inscripción</p>
                <p className="mt-2 text-base font-semibold text-white">{formatAdminMoney(event.entryFee)}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Cierre</p>
                <p className="mt-2 text-base font-semibold text-white">{formatAdminDate(event.endDate)}</p>
              </div>
            </div>
          </article>
        )) : (
          <p className="rounded-[1.3rem] border border-dashed border-white/10 bg-black/12 px-4 py-4 text-sm leading-7 text-white/62">No hay eventos cargados todavía.</p>
        )}
      </div>
    </AdminSectionScaffold>
  );
}