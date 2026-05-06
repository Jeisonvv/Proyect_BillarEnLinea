import Link from "next/link";
import { AdminSectionScaffold, formatAdminMoney } from "@/components/content/admin/shared/AdminSectionScaffold";
import { getLandingSnapshot } from "@/lib/api/public-content";

export default async function AdminStorePage() {
  const snapshot = await getLandingSnapshot();
  const products = snapshot.products.items;
  const lowStockCount = products.filter((item) => (item.stock ?? 0) <= 5).length;

  return (
    <AdminSectionScaffold
      kicker="Admin tienda"
      title="Supervisa el catálogo y el stock"
      description="Consulta rápido el inventario público, detecta referencias con existencias bajas y usa la vista de usuario para validar cómo se presenta la tienda en producción."
      primaryAction={{ label: "Dashboard", href: "/admin" }}
      secondaryAction={{ label: "Home user", href: "/home" }}
      metrics={[
        { label: "Total", value: String(snapshot.totals.products), helper: snapshot.products.error ?? "Productos visibles en el snapshot actual." },
        { label: "Stock bajo", value: String(lowStockCount), helper: "Referencias que requieren atención rápida." },
        { label: "Muestra", value: String(products.length), helper: "Productos listados en esta sección administrativa." },
      ]}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Catálogo reciente</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Radar de inventario</h2>
        </div>
        <Link className="text-sm font-medium text-white/62 transition hover:text-white" href="/home/tienda">
          Ver vista usuario
        </Link>
      </div>

      <div className="grid gap-4">
        {products.length > 0 ? products.map((product) => (
          <article key={product.id} className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xl font-semibold text-white">{product.name}</p>
                <p className="text-sm leading-7 text-white/64">{product.description ?? "Sin descripción pública."}</p>
              </div>
              <span className="rounded-full border border-[rgba(129,181,255,0.2)] bg-[rgba(129,181,255,0.12)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(217,232,255,0.96)]">{product.category ?? "Sin categoría"}</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Precio</p>
                <p className="mt-2 text-base font-semibold text-white">{formatAdminMoney(product.basePrice)}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Stock</p>
                <p className="mt-2 text-base font-semibold text-white">{product.stock ?? "Sin dato"}</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Etiquetas</p>
                <p className="mt-2 text-base font-semibold text-white">{product.tags.length > 0 ? product.tags.join(", ") : "Sin etiquetas"}</p>
              </div>
            </div>
          </article>
        )) : (
          <p className="rounded-[1.3rem] border border-dashed border-white/10 bg-black/12 px-4 py-4 text-sm leading-7 text-white/62">No hay productos cargados todavía.</p>
        )}
      </div>
    </AdminSectionScaffold>
  );
}