import { notFound } from "next/navigation";
import { AdminSectionScaffold, formatAdminDate, formatAdminMoney } from "@/components/content/admin/shared";
import { RaffleAdminDetail } from "@/components/content/admin/raffles/RaffleAdminDetail";
import {
  getRaffleByIdAdmin,
  getRaffleNumberOwnersAdmin,
  type RaffleNumberOwner,
} from "@/lib/api/admin-raffles";

export const dynamic = "force-dynamic";

export default async function AdminRaffleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let raffle;
  try {
    const response = await getRaffleByIdAdmin(id);
    raffle = response.data;
  } catch {
    notFound();
  }

  if (!raffle) notFound();

  let initialOwners: RaffleNumberOwner[] = [];
  let ownersError: string | null = null;
  try {
    const ownersResponse = await getRaffleNumberOwnersAdmin(id, { limit: 200 });
    initialOwners = ownersResponse.data?.numbers ?? [];
  } catch (error) {
    ownersError = error instanceof Error ? error.message : "No se pudieron cargar los compradores.";
  }

  const sold = raffle.soldTickets ?? 0;
  const total = raffle.totalTickets ?? 0;

  return (
    <AdminSectionScaffold
      kicker="Admin rifas · detalle"
      title={raffle.name}
      description={raffle.description ?? "Edita los datos, ejecuta el sorteo y revisa los compradores de los números."}
      secondaryAction={{ label: "Volver a rifas", href: "/admin/rifas" }}
      metrics={[
        {
          label: "Boleto",
          value: raffle.ticketPrice === 0 ? "Gratis" : formatAdminMoney(raffle.ticketPrice),
          helper: raffle.isFree ? "Rifa gratuita." : "Precio vigente del boleto.",
        },
        {
          label: "Vendidos",
          value: `${sold} / ${total}`,
          helper: total > 0 ? `${Math.round((sold / total) * 100)}% colocados.` : "Sin boletos disponibles.",
        },
        {
          label: "Sorteo",
          value: formatAdminDate(raffle.drawDate),
          helper: raffle.hasWinner ? `Ganador: ${raffle.winnerTicket ?? "—"}` : "Pendiente de ejecutar.",
        },
      ]}
    >
      <RaffleAdminDetail raffle={raffle} initialOwners={initialOwners} ownersError={ownersError} />
    </AdminSectionScaffold>
  );
}
