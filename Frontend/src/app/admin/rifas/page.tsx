import Image from "next/image";
import Link from "next/link";
import {
  AdminDeleteItemButton,
  AdminManageLink,
  AdminSectionScaffold,
  formatAdminDate,
  formatAdminMoney,
  humanizeAdminToken,
} from "@/components/content/admin/shared";
import { listRafflesAdmin, type RaffleAdminListItem } from "@/lib/api/admin-raffles";

export const dynamic = "force-dynamic";

export default async function AdminRafflesPage() {
  let raffles: RaffleAdminListItem[] = [];
  let total = 0;
  let errorMessage: string | null = null;

  try {
    const response = await listRafflesAdmin({ limit: 50 });
    raffles = response.data ?? [];
    total = response.pagination?.total ?? raffles.length;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "No se pudieron cargar las rifas.";
  }

  const activeCount = raffles.filter((raffle) => raffle.status === "ACTIVE").length;
  const drawnCount = raffles.filter((raffle) => raffle.status === "DRAWN").length;

  return (
    <AdminSectionScaffold
      kicker="Admin rifas"
      title="Gestiona las rifas activas y por sortear"
      description="Crea nuevas rifas, edita sus datos, revisa los números vendidos y ejecuta el sorteo cuando llegue el momento."
      primaryAction={{ label: "Crear rifa", href: "/admin/rifas/crear" }}
      secondaryAction={{ label: "Home user", href: "/home" }}
      metrics={[
        { label: "Total", value: String(total), helper: errorMessage ?? "Rifas registradas en el sistema." },
        { label: "Activas", value: String(activeCount), helper: "Rifas con venta de boletos en curso." },
        { label: "Sorteadas", value: String(drawnCount), helper: "Rifas que ya tienen ganador asignado." },
      ]}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Rifas recientes</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Panel de seguimiento</h2>
        </div>
        <Link className="text-sm font-medium text-white/62 transition hover:text-white" href="/home/rifas">
          Ver vista usuario
        </Link>
      </div>

      <div className="grid gap-4">
        {raffles.length > 0 ? (
          raffles.map((raffle) => {
            const sold = raffle.soldTickets ?? 0;
            const total = raffle.totalTickets ?? 0;
            const percent = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;

            return (
              <article
                key={raffle._id}
                className="overflow-hidden rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5"
              >
                <div className="grid gap-5 lg:grid-cols-[11rem_minmax(0,1fr)] lg:items-start">
                  <div className="relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-[linear-gradient(135deg,rgba(246,196,79,0.16),rgba(13,110,174,0.16),rgba(255,255,255,0.04))] aspect-4/5 min-h-48">
                    {raffle.imageUrl ? (
                      <Image
                        src={raffle.imageUrl}
                        alt={`Imagen de la rifa ${raffle.name}`}
                        fill
                        sizes="(min-width: 1024px) 11rem, (min-width: 768px) 30vw, 100vw"
                        className="object-cover object-center"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,14,0.08),rgba(8,10,14,0.18),rgba(8,10,14,0.88))]" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-[0.65rem] uppercase tracking-[0.24em] text-white/54">Visual rifa</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {raffle.imageUrl ? "Imagen cargada" : "Sin imagen"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-xl font-semibold text-white">{raffle.name}</p>
                        <p className="text-sm leading-7 text-white/64">
                          Sorteo: {formatAdminDate(raffle.drawDate ?? null)}
                        </p>
                        <p className="text-sm leading-7 text-white/64">Premio: {raffle.prize}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/78">
                          {raffle.isFree || raffle.ticketPrice === 0 ? "Gratuita" : "Con costo"}
                        </span>
                        <span className="rounded-full border border-[rgba(246,196,79,0.2)] bg-[rgba(246,196,79,0.12)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(255,233,174,0.96)]">
                          {humanizeAdminToken(raffle.status)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Boleto</p>
                        <p className="mt-2 text-base font-semibold text-white">
                          {raffle.ticketPrice === 0 ? "Gratis" : formatAdminMoney(raffle.ticketPrice)}
                        </p>
                      </div>
                      <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Boletos</p>
                        <p className="mt-2 text-base font-semibold text-white">
                          {sold} / {total}
                        </p>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                          <div
                            className="h-full bg-[linear-gradient(90deg,rgba(246,196,79,0.9),rgba(49,121,182,0.9))]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Acción</p>
                        <div className="mt-2 flex flex-wrap gap-3">
                          <AdminManageLink href={`/admin/rifas/${raffle._id}`} />
                          <AdminDeleteItemButton
                            deletePath={`/api/raffles/${raffle._id}`}
                            itemLabel="rifa"
                            itemName={raffle.name}
                            consequences={[
                              "Se eliminarán los números, boletos y reservas vinculadas a esta rifa.",
                              "También se borrarán las transacciones de pago asociadas.",
                              "Las imágenes en Cloudinary quedarán removidas.",
                            ]}
                            description={
                              <>
                                Vas a eliminar <span className="font-semibold text-white">{raffle.name}</span>. Esta acción es
                                permanente y no se puede deshacer.
                              </>
                            }
                            successMessage="Rifa eliminada correctamente."
                            variant="text"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <p className="rounded-[1.3rem] border border-dashed border-white/10 bg-black/12 px-4 py-4 text-sm leading-7 text-white/62">
            {errorMessage ?? "No hay rifas cargadas todavía."}
          </p>
        )}
      </div>
    </AdminSectionScaffold>
  );
}
