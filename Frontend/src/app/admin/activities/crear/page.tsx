import { AdminSectionScaffold } from "@/components/content/admin/shared";
import { ActivityCreateLab } from "@/components/content/admin/activities/ActivityCreateLab";

export const dynamic = "force-dynamic";

export default function AdminActivityCreatePage() {
  return (
    <AdminSectionScaffold
      kicker="Admin actividades · crear"
      title="Diseña una nueva actividad"
      description="Define el premio, configura el precio y el total de boletos, y publica la actividad para empezar a recibir compras."
      secondaryAction={{ label: "Volver a actividades", href: "/admin/activities" }}
      metrics={[
        { label: "Estado", value: "Borrador", helper: "Las actividades inician como DRAFT y se activan al publicar." },
        { label: "Total boletos", value: "Potencia de 10", helper: "Configurable solo en creación. Inmutable después." },
        { label: "Sorteo", value: "Manual", helper: "Tú escoges el número ganador desde el detalle de la actividad." },
      ]}
    >
      <ActivityCreateLab />
    </AdminSectionScaffold>
  );
}
