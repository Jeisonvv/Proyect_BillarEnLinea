import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminDeleteItemButton,
  AdminSectionScaffold,
  formatAdminMoney,
  humanizeAdminToken,
} from "@/components/content/admin/shared";
import { getProductDetailBySlug } from "@/lib/api/public-content";

export const dynamic = "force-dynamic";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductDetailBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <AdminSectionScaffold
      kicker="Admin tienda · detalle"
      title={product.name}
      description={product.description ?? "Sin descripción pública."}
      secondaryAction={{ label: "Volver a tienda", href: "/admin/tienda" }}
      metrics={[
        { label: "Categoría", value: humanizeAdminToken(product.category), helper: "Familia a la que pertenece el producto." },
        { label: "Marca", value: product.brand ?? "—", helper: "Marca o fabricante del producto." },
        { label: "Precio base", value: formatAdminMoney(product.basePrice), helper: "Precio vigente en la tienda." },
        { label: "Stock", value: product.stock !== null ? String(product.stock) : "—", helper: "Existencias disponibles." },
        { label: "Visible", value: product.isActive ? "Sí" : "No", helper: "Si el producto se muestra al público." },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Vista catálogo</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{product.name}</h2>
          {product.images.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {product.images.map((url, idx) => (
                <div key={url + idx} className="overflow-hidden rounded-2xl border border-white/8 bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${product.name} ${idx + 1}`} className="h-32 w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/56">Sin imágenes cargadas.</p>
          )}
          <p className="mt-4 text-sm leading-7 text-white/74">{product.description ?? "Sin descripción."}</p>
        </article>

        <aside className="grid gap-4">
          <section className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Acciones</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Gestiona este producto</h3>
            <div className="mt-4 grid gap-3">
              <Link
                href={`/home/tienda/${product.slug ?? product.id}`}
                className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-center text-sm font-medium text-white/82 transition hover:bg-white/10"
              >
                Ver vista pública
              </Link>
              <AdminDeleteItemButton
                deletePath={`/api/products/${product.id}`}
                itemLabel="producto"
                itemName={product.name}
                consequences={[
                  "El producto se ocultará del catálogo público (soft delete).",
                  "Se podrá reactivar editando el campo isActive.",
                ]}
                description={
                  <>
                    Vas a ocultar <span className="font-semibold text-white">{product.name}</span> del catálogo
                    público. El registro permanece en base de datos.
                  </>
                }
                successMessage="Producto ocultado correctamente."
                redirectTo="/admin/tienda"
              />
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Datos</p>
            <dl className="mt-3 grid gap-2 text-sm text-white/70">
              <div>
                <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Slug</dt>
                <dd className="text-white/86">{product.slug ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">ID</dt>
                <dd className="text-white/86">{product.id}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Etiquetas</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.tags.length > 0 ? product.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-[rgba(129,181,255,0.2)] bg-[rgba(129,181,255,0.12)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(217,232,255,0.96)]">{tag}</span>
              )) : (
                <span className="text-sm text-white/56">Sin etiquetas.</span>
              )}
            </div>
          </section>
        </aside>
      </div>
    </AdminSectionScaffold>
  );
}
