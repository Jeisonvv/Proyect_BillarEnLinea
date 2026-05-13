import { AdminSectionScaffold } from "@/components/content/admin/shared";
import { PostCreateLab } from "@/components/content/admin/posts";

export const dynamic = "force-dynamic";

export default function AdminPostCreatePage() {
  return (
    <AdminSectionScaffold
      kicker="Admin noticias · crear"
      title="Publica una nueva noticia"
      description="Define el título, extracto y contenido. Configura la categoría, las etiquetas y la información SEO para que la pieza aparezca correctamente en buscadores y la sección de noticias."
      secondaryAction={{ label: "Volver a noticias", href: "/admin/noticias" }}
      metrics={[
        { label: "Estado inicial", value: "Borrador", helper: "Las noticias se crean como DRAFT y se publican cambiando a PUBLISHED." },
        { label: "Slug", value: "Automático", helper: "Se genera desde el título si no se ingresa uno manual." },
        { label: "Lectura", value: "Calculada", helper: "El backend estima el tiempo de lectura desde el contenido." },
      ]}
    >
      <PostCreateLab />
    </AdminSectionScaffold>
  );
}
