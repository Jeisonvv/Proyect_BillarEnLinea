import Link from "next/link";
import { getLandingEvents, getLandingPosts, getLandingProducts, getLandingRaffles, getLandingTournaments } from "@/lib/api/public-content";
import { EventCard } from "@/components/content/user/events";
import { PostCard } from "@/components/content/user/posts";
import { ProductCard } from "@/components/content/user/products";
import { RaffleCard } from "@/components/content/user/raffles";
import { TournamentCard } from "@/components/content/user/tournaments";
import { getServerSession } from "@/lib/auth/server-session";

function HomeSection({
  eyebrow,
  title,
  description,
  href,
  cta,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 rounded-4xl border border-white/8 bg-[linear-gradient(180deg,rgba(10,13,18,0.94),rgba(10,14,20,0.9))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] sm:p-6 lg:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="text-[0.72rem] uppercase tracking-[0.3em] text-[#f6c44f]">{eyebrow}</p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
          <p className="text-sm leading-7 text-white/68 sm:text-base">{description}</p>
        </div>
        <Link
          className="inline-flex w-fit items-center justify-center rounded-full border border-[rgba(246,196,79,0.24)] bg-[rgba(246,196,79,0.1)] px-5 py-3 text-sm font-semibold text-[rgba(255,240,194,0.92)] transition hover:bg-[rgba(246,196,79,0.18)] hover:text-white"
          href={href}
        >
          {cta}
        </Link>
      </div>
      {children}
    </section>
  );
}

export default async function PageHome() {
  const [torneos, eventos, rifas, noticias, productos] = await Promise.all([
    getLandingTournaments(),
    getLandingEvents(),
    getLandingRaffles(),
    getLandingPosts(),
    getLandingProducts(),
    getServerSession(),
  ]);

  return (
    <main className="grid gap-6">
      <HomeSection
        eyebrow="Torneos"
        title="Competiciones activas para entrar a jugar"
        description="Consulta las fechas abiertas, revisa los cupos y entra al detalle de cada torneo para tomar una decision rapida desde el home."
        href="/home/torneos"
        cta="Ver todos los torneos"
      >
        <div className="grid gap-4">
          {torneos.items.length > 0 ? torneos.items.map((torneo, index) => (
            <TournamentCard key={torneo.id} item={torneo} prioritizeImage={index === 0} />
          )) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-black/12 px-5 py-6 text-sm leading-7 text-white/62">
              No hay torneos disponibles por ahora.
            </div>
          )}
        </div>
      </HomeSection>

      <HomeSection
        eyebrow="Eventos"
        title="Encuentros, activaciones y agenda curada"
        description="Deja visible para el cliente la programacion de eventos con una lectura rapida del tipo, estado y costo de acceso."
        href="/home/eventos"
        cta="Ver todos los eventos"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {eventos.items.length > 0 ? eventos.items.map((evento) => (
            <EventCard key={evento.id} item={evento} />
          )) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-black/12 px-5 py-6 text-sm leading-7 text-white/62 lg:col-span-3">
              Aun no hay eventos publicados para mostrar en esta seccion.
            </div>
          )}
        </div>
      </HomeSection>

      <HomeSection
        eyebrow="Tienda"
        title="Productos listos para salir a mesa"
        description="Deja visibles los productos destacados para que el cliente encuentre tacos, accesorios y referencias curadas sin salir de la portada autenticada."
        href="/home/tienda"
        cta="Ver toda la tienda"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {productos.items.length > 0 ? productos.items.map((producto) => (
            <ProductCard key={producto.id} item={producto} />
          )) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-black/12 px-5 py-6 text-sm leading-7 text-white/62 lg:col-span-3">
              Aun no hay productos visibles en la tienda.
            </div>
          )}
        </div>
      </HomeSection>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <HomeSection
          eyebrow="Rifas"
          title="Premios y dinamicas activas"
          description="Muestra las rifas destacadas para que el cliente vea rapido el premio, el valor del numero y la fecha del sorteo."
          href="/home/rifas"
          cta="Ver todas las rifas"
        >
          <div className="grid gap-4">
            {rifas.items.length > 0 ? rifas.items.map((rifa) => (
              <RaffleCard key={rifa.id} item={rifa} />
            )) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-black/12 px-5 py-6 text-sm leading-7 text-white/62">
                No hay rifas activas en este momento.
              </div>
            )}
          </div>
        </HomeSection>

        <HomeSection
          eyebrow="Noticias"
          title="Novedades para seguir el pulso del billar"
          description="Publicaciones recientes para que el cliente encuentre contexto, anuncios y cobertura sin salir del ecosistema de la plataforma."
          href="/home/noticias"
          cta="Ver todas las noticias"
        >
          <div className="grid gap-4">
            {noticias.items.length > 0 ? noticias.items.map((post) => (
              <PostCard key={post.id} item={post} />
            )) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-black/12 px-5 py-6 text-sm leading-7 text-white/62">
                No hay noticias publicadas por ahora.
              </div>
            )}
          </div>
        </HomeSection>
      </div>
    </main>
  );
}