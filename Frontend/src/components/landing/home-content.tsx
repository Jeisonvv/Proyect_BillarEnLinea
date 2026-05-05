import Image from "next/image";
import Link from "next/link";
import type { LandingSnapshot } from "@/lib/api/public-content";
import { EmptyState } from "@/components/content/EmptyState";
import { EventCard } from "@/components/content/EventCard";
import { MetricCard } from "@/components/content/MetricCard";
import { PostCard } from "@/components/content/PostCard";
import { ProductCard } from "@/components/content/ProductCard";
import { RaffleCard } from "@/components/content/RaffleCard";
import { SectionHeading } from "@/components/content/SectionHeading";
import { TournamentCard } from "@/components/content/TournamentCard";
import { absoluteUrl, siteConfig } from "@/lib/site";

function getStructuredData(snapshot: LandingSnapshot) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsOrganization",
        name: siteConfig.name,
        url: absoluteUrl("/"),
        description: siteConfig.description,
        areaServed: ["CO", "LATAM"],
        knowsAbout: siteConfig.keywords,
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Servicios Billar en Linea",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Torneos y eventos de billar",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Noticias y actualidad del billar",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Tienda especializada de billar",
              },
            },
          ],
        },
      },
      {
        "@type": "WebSite",
        name: siteConfig.name,
        url: absoluteUrl("/"),
        inLanguage: "es",
        description: siteConfig.description,
      },
      {
        "@type": "CollectionPage",
        name: `${siteConfig.name} | Inicio`,
        url: absoluteUrl("/"),
        hasPart: [
          { "@type": "ItemList", name: "Torneos", numberOfItems: snapshot.tournaments.total },
          { "@type": "ItemList", name: "Eventos", numberOfItems: snapshot.events.total },
          { "@type": "ItemList", name: "Sorteos", numberOfItems: snapshot.raffles.total },
          { "@type": "ItemList", name: "Noticias", numberOfItems: snapshot.posts.total },
          { "@type": "ItemList", name: "Tienda", numberOfItems: snapshot.products.total },
        ],
      },
    ],
  };
}

export function HomeContent({ snapshot }: { snapshot: LandingSnapshot }) {
  const structuredData = getStructuredData(snapshot);
  const serviceHighlights = [
    {
      id: "torneos",
      eyebrow: "Torneos",
      title: "Torneos de billar — fechas, formatos y cupos",
      body: "Consulta los torneos de billar disponibles, revisa fechas, formatos, categorías y cupos, y decide en cuál quieres inscribirte.",
    },
    {
      id: "eventos",
      eyebrow: "Eventos",
      title: "Eventos de billar — exhibiciones y encuentros para la comunidad.",
      body: "Explora encuentros, exhibiciones y actividades de billar pensadas para jugadores, aficionados y marcas del deporte en Colombia.",
    },
    {
      id: "rifas",
      eyebrow: "Rifas",
      title: "Rifas de billar — sorteos activos con premios reales.",
      body: "Revisa los sorteos de billar activos, conoce los premios disponibles y participa en pocos pasos desde una plataforma confiable.",
    },
    {
      id: "tienda",
      eyebrow: "Tienda",
      title: "Tienda de billar — accesorios y productos especializados",
      body: "Encuentra tacos, estuches, accesorios y artículos de billar seleccionados para complementar tu juego y equipamiento.",
    },
  ];
  const serviceBenefits = [
    "Consulta torneos de billar activos y sus fechas sin navegar de más.",
    "Descubre eventos, rifas y productos especializados en una sola experiencia.",
    "Crea tu cuenta gratis y recibe novedades de la comunidad del billar en Colombia.",
  ];

  return (
    <main className="relative isolate overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="mx-auto flex w-full max-w-7xl flex-col px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-12 lg:pb-24">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,#090b10_0%,#0f141c_48%,#17130e_100%)] text-white shadow-[0_40px_120px_rgba(3,6,10,0.42)] sm:rounded-[2.8rem]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(246,196,79,0.2),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(13,110,174,0.18),transparent_22%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_55%)]" />
          <div className="relative px-5 py-6 sm:px-8 sm:py-10 lg:px-10 lg:py-12 xl:px-12 xl:py-14">
            <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.24)] sm:p-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(246,196,79,0.16),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_24%)]" />
              <div className="relative overflow-hidden rounded-[1.35rem] border border-white/8">
                <Image
                  src="/hero_portada.png"
                  alt="Vista principal de Billar en Linea"
                  width={2000}
                  height={800}
                  sizes="(min-width: 1280px) 1120px, 100vw"
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
              <div className="space-y-5">
                <p className="font-mono text-xs uppercase tracking-[0.36em] text-accent">
                  Torneos, eventos y tienda de billar en un solo lugar
                </p>
                <h1 className="max-w-3xl text-2xl font-semibold leading-tight text-white sm:text-3xl xl:text-4xl">
                  Consulta torneos activos, descubre eventos y rifas, y encuentra productos de billar seleccionados para jugadores y aficionados como tu.
                </h1>
               
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-[#0B0B0D] transition hover:bg-accent-strong" href="/register">
                    Crear cuenta gratis
                  </Link>
                  <a className="inline-flex items-center justify-center rounded-full border border-white/12 px-6 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/8" href="#servicios">
                    Ver torneos y eventos
                  </a>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <article className="rounded-[1.7rem] border border-white/10 bg-white/6 p-5">
                  <p className="text-[0.7rem] uppercase tracking-[0.26em] text-white/42">Para ti</p>
                  <h2 className="mt-3 text-xl font-semibold text-white">Accede a torneos, eventos, rifas y tienda desde la portada</h2>
                  <p className="mt-2 text-sm leading-7 text-white/68">En Billar en Linea organizamos cada sección para que llegues directo a lo que buscas: torneos para competir, eventos para disfrutar, rifas para participar y productos para tu juego.</p>
                </article>
                <article className="rounded-[1.7rem] border border-[rgba(246,196,79,0.22)] bg-[rgba(246,196,79,0.08)] p-5">
                  <p className="text-[0.7rem] uppercase tracking-[0.26em] text-[rgba(246,196,79,0.7)]">Registro rapido</p>
                  <p className="mt-3 text-xl font-semibold text-white">Regístrate gratis y sigue la actividad del billar en Colombia</p>
                  <p className="mt-2 text-sm leading-7 text-white/70">Con tu cuenta accedes a torneos activos, notificaciones de eventos y novedades de la comunidad del billar sin perderte ninguna fecha..</p>
                </article>
              </div>

              <div className="grid gap-4 md:grid-cols-3 xl:col-span-2">
                <MetricCard
                  value={`${snapshot.totals.tournaments}+`}
                  label="Torneos"
                  note="Torneos activos con fechas, formatos y cupos disponibles para inscribirse."
                />
                <MetricCard
                  value={`${snapshot.totals.events + snapshot.totals.raffles}+`}
                  label="Eventos y rifas"
                  note="Eventos y rifas para jugadores, aficionados y marcas del billar en Colombia."
                />
                <MetricCard
                  value={`${snapshot.totals.posts + snapshot.totals.products}+`}
                  label="Contenido"
                  note="Noticias, novedades y productos especializados de billar en una sola plataforma."
                />
              </div>
            </div>
          </div>
        </header>

        <section id="servicios" className="defer-render grid gap-8 pb-16 pt-16 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:items-start xl:gap-10 lg:pb-18 lg:pt-18">
          <div className="space-y-6 xl:sticky xl:top-24">
            <SectionHeading
              eyebrow="Servicios"
              title="Todo lo que necesitas para vivir el billar: torneos, eventos, rifas y tienda especializada."
              description="Billar en Linea reúne en un solo sitio los torneos donde competir, los eventos donde participar, las rifas disponibles y los productos de billar para tu equipamiento."
            />

            <article className="rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.18)]">
              <p className="text-[0.7rem] uppercase tracking-[0.26em] text-white/42">Por que registrarte</p>
              <div className="mt-4 grid gap-3">
                {serviceBenefits.map((benefit) => (
                  <div key={benefit} className="rounded-[1.15rem] border border-white/8 bg-black/18 px-4 py-3 text-sm leading-6 text-white/72">
                    {benefit}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row xl:flex-col xl:items-start">
                <Link className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#0B0B0D] transition hover:bg-accent-strong" href="/register">
                  Crear cuenta
                </Link>
                <a className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white/82 transition hover:bg-white/8" href="#torneos-contenido">
                  Ver contenido en vivo
                </a>
              </div>
            </article>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {serviceHighlights.map((service, index) => (
              <article
                id={service.id}
                key={service.id}
                className={`rounded-[1.9rem] border p-6 shadow-[0_26px_60px_rgba(5,7,10,0.24)] sm:p-8 ${index % 2 === 0 ? "border-line bg-[linear-gradient(135deg,rgba(9,15,23,0.96),rgba(6,10,16,0.92))]" : "border-[rgba(246,196,79,0.14)] bg-[linear-gradient(135deg,rgba(22,24,28,0.98),rgba(13,110,174,0.16))]"}`}
              >
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-[rgba(246,196,79,0.68)]">{service.eyebrow}</p>
                <h3 className="mt-4 font-display text-3xl leading-none text-white sm:text-4xl lg:text-5xl">{service.title}</h3>
                <p className="mt-5 text-sm leading-7 text-white/72 sm:text-base sm:leading-8">{service.body}</p>
                <div className="mt-6">
                  <a className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/82 transition hover:bg-white/8" href={`#${service.id}-contenido`}>
                    Ver seccion
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="defer-render space-y-8 pb-18">
          <SectionHeading
            eyebrow="Explorar"
            title="Navega torneos, eventos, rifas y tienda de billar en una sola plataforma."
            description="La portada de Billar en Linea está diseñada para que pases de torneos a eventos, rifas o tienda sin fricción, con información relevante en cada paso."
          />

          <div id="torneos-contenido" className="grid gap-5 xl:grid-cols-[1.15fr_1fr_0.95fr]">
            <div className="rounded-[2rem] border border-line bg-[linear-gradient(160deg,rgba(22,24,28,0.96),rgba(13,110,174,0.14))] p-5 shadow-[0_28px_90px_rgba(13,110,174,0.14)]">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-white/50">Torneos activos</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Competencia con contexto</h3>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/60">{snapshot.tournaments.total}</span>
              </div>
              <div className="mt-5 grid gap-4">
                {snapshot.tournaments.items.length > 0 ? (
                  snapshot.tournaments.items.map((item) => <TournamentCard key={item.id} item={item} />)
                ) : (
                  <EmptyState
                    title="Pronto veras nuevos torneos"
                    body="En cuanto se publiquen nuevas fechas, apareceran aqui para que puedas revisarlas facilmente."
                  />
                )}
              </div>
            </div>

            <div id="eventos-contenido" className="space-y-5">
              <div className="rounded-[2rem] border border-line bg-[linear-gradient(180deg,rgba(7,12,20,0.98),rgba(10,16,24,0.92))] p-5 shadow-[0_28px_70px_rgba(5,8,14,0.28)]">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-accent-soft">Eventos</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Eventos para compartir la pasion por el billar</h3>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/65">{snapshot.events.total}</span>
                </div>
                <div className="mt-5 grid gap-4">
                  {snapshot.events.items.length > 0 ? (
                    snapshot.events.items.map((item) => <EventCard key={item.id} item={item} />)
                  ) : (
                    <EmptyState
                        title="Muy pronto habra nuevos eventos"
                        body="Cuando se publiquen nuevas actividades, las encontraras aqui con toda la informacion importante."
                    />
                  )}
                </div>
              </div>
            </div>

            <div id="rifas-contenido" className="space-y-5">
              <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(11,11,13,0.98),rgba(22,24,28,0.96))] p-5 shadow-[0_28px_75px_rgba(8,12,12,0.25)]">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-stone-500">Sorteos</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Rifas y premios para la comunidad</h3>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-stone-400">{snapshot.raffles.total}</span>
                </div>
                <div className="mt-5 grid gap-4">
                  {snapshot.raffles.items.length > 0 ? (
                    snapshot.raffles.items.map((item) => <RaffleCard key={item.id} item={item} />)
                  ) : (
                    <EmptyState
                        title="Nuevas rifas muy pronto"
                        body="Cuando haya sorteos disponibles, podras verlos aqui de forma clara y rapida."
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="defer-render grid gap-8 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-18">
          <div id="noticias" className="space-y-8">
            <SectionHeading
              eyebrow="Noticias relevantes"
              title="Sigue las noticias que mantienen vivo el mundo del billar."
              description="Encuentra novedades, historias y momentos importantes para mantenerte al dia con lo que pasa dentro y fuera de la mesa."
            />
            <div className="grid gap-5">
              {snapshot.posts.items.length > 0 ? (
                snapshot.posts.items.map((item) => <PostCard key={item.id} item={item} />)
              ) : (
                <EmptyState
                  title="Pronto veras nuevas noticias"
                  body="Cuando se publiquen nuevas historias, apareceran aqui para que sigas de cerca la actualidad del billar."
                />
              )}
            </div>
          </div>

          <div id="tienda-contenido" className="space-y-8">
            <SectionHeading
              eyebrow="Tienda especializada"
              title="Todo lo que necesitas para seguir jugando y disfrutando."
              description="La tienda reune productos y accesorios pensados para acompanar tu juego dentro de una experiencia visual coherente y facil de explorar."
            />
            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-1">
              {snapshot.products.items.length > 0 ? (
                snapshot.products.items.map((item) => <ProductCard key={item.id} item={item} />)
              ) : (
                <EmptyState
                  title="Muy pronto habra productos disponibles"
                  body="En cuanto el catalogo este publicado, podras descubrirlo aqui con una vista clara y ordenada."
                />
              )}
            </div>
          </div>
        </section>

        <section className="defer-render relative overflow-hidden rounded-[2rem] border border-line bg-[linear-gradient(135deg,#13211f_0%,#0d1715_38%,#d59558_100%)] px-4 py-8 text-white shadow-[0_34px_100px_rgba(12,17,16,0.24)] sm:rounded-[2.7rem] sm:px-6 sm:py-10 lg:px-10 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.14),transparent_24%),linear-gradient(120deg,rgba(255,255,255,0.04),transparent_34%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-8">
            <div className="max-w-3xl space-y-4">
              <h2 className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.28em] text-white/88 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
                Únete a la plataforma de billar en Colombia
              </h2>
              <h2 className="font-display text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">Crea tu cuenta y sigue todo lo que pasa en Billar en Linea.</h2>
              <p className="text-sm leading-7 text-white/75 sm:text-base lg:text-lg lg:leading-8">
                Regístrate gratis en Billar en Linea y accede a torneos activos, eventos, rifas y la tienda especializada de billar en Colombia.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link className="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-[#0B0B0D] transition-colors duration-300 hover:bg-accent-strong hover:text-[#0B0B0D] sm:w-auto" href="/register">
                Crear cuenta gratis
              </Link>
              <Link className="inline-flex w-full items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/8 sm:w-auto" href="/login">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}