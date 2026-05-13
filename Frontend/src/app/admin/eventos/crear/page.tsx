import { AdminSectionScaffold } from "@/components/content/admin/shared";
import { EventCreateLab } from "@/components/content/admin/events";

export const dynamic = "force-dynamic";

export default function AdminEventCreatePage() {
  return (
    <AdminSectionScaffold
      kicker="Admin eventos · crear"
      title="Diseña un nuevo evento"
      description="Define el nombre, tipo, alcance y fechas; configura la inscripción y la boletería, y publica el evento para que aparezca en el calendario."
      secondaryAction={{ label: "Volver a eventos", href: "/admin/eventos" }}
      metrics={[
        { label: "Estado", value: "Programado", helper: "Los eventos inician como SCHEDULED y pueden activarse a LIVE." },
        { label: "Inscripción", value: "Configurable", helper: "Puede ser sin inscripción, por enlace externo o interna." },
        { label: "Boletería", value: "Configurable", helper: "Sin tickets, link externo o boletería interna con tribuna." },
      ]}
    >
      <EventCreateLab />
    </AdminSectionScaffold>
  );
}
