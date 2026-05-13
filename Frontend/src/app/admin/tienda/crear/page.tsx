import { AdminSectionScaffold } from "@/components/content/admin/shared";
import { ProductCreateLab } from "@/components/content/admin/products";

export const dynamic = "force-dynamic";

export default function AdminProductCreatePage() {
  return (
    <AdminSectionScaffold
      kicker="Admin tienda · crear"
      title="Agrega un nuevo producto"
      description="Define el nombre, categoría y precio base. Sube imágenes y configura etiquetas para que el producto aparezca correctamente en el catálogo de la tienda."
      secondaryAction={{ label: "Volver a tienda", href: "/admin/tienda" }}
      metrics={[
        { label: "Estado inicial", value: "Activo", helper: "Los productos nuevos quedan visibles en la tienda por defecto." },
        { label: "Slug", value: "Automático", helper: "Se genera desde el nombre si no se ingresa uno manual." },
        { label: "Inventario", value: "Configurable", helper: "Define stock base o usa variantes para SKUs específicos." },
      ]}
    >
      <ProductCreateLab />
    </AdminSectionScaffold>
  );
}
