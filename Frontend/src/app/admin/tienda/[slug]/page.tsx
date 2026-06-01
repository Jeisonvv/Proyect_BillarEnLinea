import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ProductEditLab, ProductVariantsEditor } from "@/components/content/admin/products";
import {
  AdminDeleteItemButton,
  AdminSectionScaffold,
  formatAdminMoney,
  humanizeAdminToken,
} from "@/components/content/admin/shared";
import { getAdminProductById } from "@/lib/api/admin-products";

export const dynamic = "force-dynamic";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieHeader = (await cookies()).toString();
  const payload = await getAdminProductById(slug, cookieHeader);
  const product = payload.data;

  if (!product || !product.name || !product.category || product.basePrice === undefined || product.stock === undefined) {
    notFound();
  }

  const productName = product.name;
  const productCategory = product.category ?? "OTHER";
  const productBrand = product.brand ?? null;
  const productDescription = product.description ?? null;
  const productBasePrice = product.basePrice ?? 0;
  const productStock = product.stock ?? 0;
  const productIsActive = product.isActive ?? true;
  const productImages = product.images ?? [];
  const productTags = product.tags ?? [];
  const productVariants = product.variants ?? [];
  const productSlug = product.slug ?? product.id;

  return (
    <AdminSectionScaffold
      kicker="Admin tienda · detalle"
      title={productName}
      description={productDescription ?? "Sin descripción pública."}
      secondaryAction={{ label: "Volver a tienda", href: "/admin/tienda" }}
      metrics={[
        { label: "Categoría", value: humanizeAdminToken(productCategory), helper: "Familia a la que pertenece el producto." },
        { label: "Marca", value: productBrand ?? "—", helper: "Marca o fabricante del producto." },
        { label: "Precio base", value: formatAdminMoney(productBasePrice), helper: "Precio vigente en la tienda." },
        { label: "Stock", value: productStock !== null ? String(productStock) : "—", helper: "Existencias disponibles." },
        { label: "Visible", value: productIsActive ? "Sí" : "No", helper: "Si el producto se muestra al público." },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Vista catálogo</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{productName}</h2>
          {productImages.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {productImages.map((url, idx) => (
                <div key={url + idx} className="overflow-hidden rounded-2xl border border-white/8 bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${productName} ${idx + 1}`} className="h-32 w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/56">Sin imágenes cargadas.</p>
          )}
          <p className="mt-4 text-sm leading-7 text-white/74">{productDescription ?? "Sin descripción."}</p>
        </article>

        <aside className="grid gap-4">
          <section className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Acciones</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Gestiona este producto</h3>
            <div className="mt-4 grid gap-3">
              <Link
                href={`/home/tienda/${productSlug}`}
                className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-center text-sm font-medium text-white/82 transition hover:bg-white/10"
              >
                Ver vista pública
              </Link>
              <AdminDeleteItemButton
                deletePath={`/api/products/${product.id}`}
                itemLabel="producto"
                itemName={productName}
                openLabel="Ocultar producto"
                confirmLabel="Sí, ocultar producto"
                pendingOpenLabel="Ocultando..."
                pendingConfirmLabel="Ocultando producto..."
                consequences={[
                  "El producto se ocultará del catálogo público (soft delete).",
                  "Se podrá reactivar editando el campo isActive.",
                ]}
                description={
                  <>
                    Vas a ocultar <span className="font-semibold text-white">{productName}</span> del catálogo
                    público. El registro permanece en base de datos.
                  </>
                }
                successMessage="Producto ocultado correctamente."
                redirectTo="/admin/tienda"
                tone="warning"
              />
              <AdminDeleteItemButton
                deletePath={`/api/products/${product.id}/permanent`}
                itemLabel="producto"
                itemName={productName}
                openLabel="Eliminar producto"
                confirmLabel="Sí, eliminar producto"
                pendingOpenLabel="Eliminando..."
                pendingConfirmLabel="Eliminando producto..."
                consequences={[
                  "El producto se borrará de forma permanente de la base de datos.",
                  "Esta acción no se puede deshacer.",
                ]}
                description={
                  <>
                    Vas a eliminar <span className="font-semibold text-white">{productName}</span> de forma permanente.
                  </>
                }
                successMessage="Producto eliminado definitivamente."
                redirectTo="/admin/tienda"
                variant="text"
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
            {/* <div className="mt-3 flex flex-wrap gap-2">
              {productTags.length > 0 ? productTags.map((tag) => (
                <span key={tag} className="rounded-full border border-[rgba(129,181,255,0.2)] bg-[rgba(129,181,255,0.12)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(217,232,255,0.96)]">{tag}</span>
              )) : (
                <span className="text-sm text-white/56">Sin etiquetas.</span>
              )}
            </div> */}
          </section>

          <ProductEditLab
            productId={product.id}
            initialName={productName}
            initialSlug={product.slug}
            initialBrand={productBrand}
            initialDescription={productDescription}
            initialCategory={productCategory}
            initialBasePrice={productBasePrice}
            initialStock={productStock}
            initialIsActive={productIsActive}
            initialTags={productTags}
          />

          <ProductVariantsEditor
            productId={product.id}
            productName={productName}
            productCategory={productCategory}
            productBrand={productBrand}
            initialVariants={productVariants}
          />
        </aside>
      </div>
    </AdminSectionScaffold>
  );
}
