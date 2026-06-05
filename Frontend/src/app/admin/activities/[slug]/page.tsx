import { notFound } from "next/navigation";
import { AdminSectionScaffold, formatAdminDate, formatAdminMoney } from "@/components/content/admin/shared";
import { ActivityAdminDetail } from "@/components/content/admin/activities/ActivityAdminDetail";
import {
  getActivityByIdAdmin,
  getActivityNumberOwnersAdmin,
  type ActivityNumberOwner,
} from "@/lib/api/admin-activities";

export const dynamic = "force-dynamic";

export default async function AdminActivityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let activity;
  try {
    const response = await getActivityByIdAdmin(slug);
    activity = response.data;
  } catch {
    notFound();
  }

  if (!activity) notFound();

  let initialOwners: ActivityNumberOwner[] = [];
  let initialOwnersTotal = 0;
  let initialOwnersPage = 1;
  let initialOwnersLimit = 50;
  let ownersError: string | null = null;
  try {
    const ownersResponse = await getActivityNumberOwnersAdmin(activity._id, { page: 1, limit: 50 });
    initialOwners = ownersResponse.data?.numbers ?? [];
    initialOwnersTotal = ownersResponse.data?.total ?? initialOwners.length;
    initialOwnersPage = ownersResponse.data?.page ?? 1;
    initialOwnersLimit = ownersResponse.data?.limit ?? 50;
  } catch (error) {
    ownersError = error instanceof Error ? error.message : "No se pudieron cargar los compradores.";
  }

  const sold = activity.soldTickets ?? 0;
  const total = activity.totalTickets ?? 0;

  return (
    <AdminSectionScaffold
      kicker="Admin actividades · detalle"
      title={activity.name}
      description={activity.description ?? "Edita los datos, ejecuta el sorteo y revisa los compradores de los números."}
      secondaryAction={{ label: "Volver a actividades", href: "/admin/activities" }}
      metrics={[
        {
          label: "Boleto",
          value: activity.ticketPrice === 0 ? "Gratis" : formatAdminMoney(activity.ticketPrice),
          helper: activity.isFree ? "Actividad gratuita." : "Precio vigente del boleto.",
        },
        {
          label: "Vendidos",
          value: `${sold} / ${total}`,
          helper: total > 0 ? `${Math.round((sold / total) * 100)}% colocados.` : "Sin boletos disponibles.",
        },
        {
          label: "Sorteo",
          value: formatAdminDate(activity.drawDate),
          helper: activity.hasWinner ? `Ganador: ${activity.winnerTicket ?? "—"}` : "Pendiente de ejecutar.",
        },
      ]}
    >
      <ActivityAdminDetail
        activity={activity}
        initialOwners={initialOwners}
        initialOwnersTotal={initialOwnersTotal}
        initialOwnersPage={initialOwnersPage}
        initialOwnersLimit={initialOwnersLimit}
        ownersError={ownersError}
      />
    </AdminSectionScaffold>
  );
}
