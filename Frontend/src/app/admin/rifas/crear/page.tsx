import { AdminSectionScaffold } from "@/components/content/admin/shared";
import { RaffleCreateLab } from "@/components/content/admin/raffles/RaffleCreateLab";

export const dynamic = "force-dynamic";

export default function AdminRaffleCreatePage() {
  return (
    <AdminSectionScaffold
      kicker="Admin rifas · crear"
      title="Diseña una nueva rifa"
      description="Define el premio, configura el precio y el total de boletos, y publica la rifa para empezar a recibir compras."
      secondaryAction={{ label: "Volver a rifas", href: "/admin/rifas" }}
      metrics={[
        { label: "Estado", value: "Borrador", helper: "Las rifas inician como DRAFT y se activan al publicar." },
        { label: "Total boletos", value: "Potencia de 10", helper: "Configurable solo en creación. Inmutable después." },
        { label: "Sorteo", value: "Manual", helper: "Tú escoges el número ganador desde el detalle de la rifa." },
      ]}
    >
      <RaffleCreateLab />
    </AdminSectionScaffold>
  );
}
