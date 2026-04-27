import Image from "next/image";
import Link from "next/link";
import type {
  LandingEvent,
  LandingPost,
  LandingProduct,
  LandingRaffle,
  LandingSnapshot,
  LandingTournament,
} from "@/lib/api/public-content";
import { absoluteUrl, siteConfig } from "@/lib/site";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const moneyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function humanizeToken(value: string | null) {
  if (!value) {
    return "Disponible pronto";
  }

  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Fecha por anunciar";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateFormatter.format(parsed);
}

function formatMoney(value: number | null) {
  if (value === null) {
    return "Consulta precio";
  }

  if (value <= 0) {
    return "Entrada libre";
  }

  return moneyFormatter.format(value);
}

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

function MetricCard({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <article className="rounded-[1.6rem] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-white/50">{label}</p>
      <p className="mt-4 font-display text-4xl leading-none text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-white/70">{note}</p>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl space-y-4">
      <p className="font-mono text-xs uppercase tracking-[0.34em] text-accent">{eyebrow}</p>
      <h2 className="font-display text-3xl leading-tight text-foreground sm:text-4xl lg:text-5xl">{title}</h2>
      <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base lg:text-lg">{description}</p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-line bg-white/5 p-5">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-accent-soft">{title}</p>
      <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
    </div>
  );
}

function TournamentCard({ item }: { item: LandingTournament }) {
  return (
    <article className="rounded-[1.55rem] border border-white/10 bg-white/6 p-5 transition duration-300 hover:-translate-y-1 hover:bg-white/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-white/55">{humanizeToken(item.status)}</p>
          <h3 className="mt-3 text-xl font-semibold text-white">{item.name}</h3>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/65">{humanizeToken(item.format)}</span>
      </div>
      <div className="mt-5 grid gap-3 text-sm text-white/70 md:grid-cols-2">
        <p>{formatDate(item.startDate)}</p>
        <p>{formatMoney(item.entryFee)}</p>
      </div>
      <p className="mt-4 text-sm leading-7 text-white/70">
        {item.maxParticipants ? `${item.maxParticipants} cupos pensados para una jornada bien armada.` : "Agenda competitiva con foco en experiencia, ritmo y comunidad."}
      </p>
    </article>
  );
}

function EventCard({ item }: { item: LandingEvent }) {
  return (
    <article className="rounded-[1.45rem] border border-line bg-[linear-gradient(180deg,rgba(10,18,28,0.96),rgba(8,14,22,0.9))] p-5 shadow-[0_22px_50px_rgba(5,8,14,0.3)] transition duration-300 hover:-translate-y-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-accent-soft">{humanizeToken(item.tier)}</span>
        <span className="rounded-full border border-line px-3 py-1 text-xs text-white/70">{humanizeToken(item.status)}</span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-white">{item.name}</h3>
      <p className="mt-3 text-sm leading-7 text-white/70">
        {`${humanizeToken(item.type)}${item.featured ? " destacado" : " curado"} para jugadores, marcas y publico que sigue el billar de cerca.`}
      </p>
      <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/72">
        <span>{formatDate(item.startDate)}</span>
        <span>{formatMoney(item.entryFee)}</span>
        {item.endDate ? <span>hasta {formatDate(item.endDate)}</span> : null}
      </div>
    </article>
  );
}

function RaffleCard({ item }: { item: LandingRaffle }) {
  return (
    <article className="rounded-[1.45rem] border border-line bg-black/85 p-5 text-stone-100 shadow-[0_28px_60px_rgba(8,10,9,0.22)]">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-stone-500">{humanizeToken(item.saleStatus ?? item.status)}</span>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-300">{formatMoney(item.ticketPrice)}</span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-white">{item.name}</h3>
      <p className="mt-3 text-sm leading-7 text-stone-300">{item.prize ?? "Premios pensados para mantener activa a la comunidad y premiar su participacion."}</p>
      <p className="mt-5 text-sm text-stone-400">Sorteo: {formatDate(item.drawDate)}</p>
    </article>
  );
}

function PostCard({ item }: { item: LandingPost }) {
  return (
    <article className="rounded-[1.5rem] border border-line bg-[linear-gradient(180deg,rgba(9,14,22,0.94),rgba(11,18,28,0.9))] p-6 shadow-[0_22px_60px_rgba(5,7,11,0.32)] transition duration-300 hover:-translate-y-1">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-accent-soft">Noticias</span>
        <span className="text-sm text-white/55">{formatDate(item.publishedAt)}</span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-white">{item.title}</h3>
      <p className="mt-4 text-sm leading-7 text-white/72">
        {item.excerpt ?? "Cobertura, analisis y contexto para seguir el billar nacional e internacional sin perder el hilo de la temporada."}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {(item.tags.length > 0 ? item.tags : ["billar", "actualidad"]).slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full border border-line px-3 py-1 text-xs text-white/68">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

function ProductCard({ item }: { item: LandingProduct }) {
  return (
    <article className="rounded-[1.55rem] border border-line bg-[linear-gradient(180deg,rgba(14,20,30,0.96),rgba(8,13,20,0.92))] p-5 shadow-[0_22px_55px_rgba(3,6,10,0.32)] transition duration-300 hover:-translate-y-1">
      <div className="rounded-[1.2rem] border border-[rgba(246,196,79,0.22)] bg-[linear-gradient(135deg,rgba(246,196,79,0.12),rgba(13,110,174,0.12))] p-4">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-accent-soft">{humanizeToken(item.category)}</p>
        <h3 className="mt-3 text-xl font-semibold text-white">{item.name}</h3>
        <p className="mt-4 text-sm leading-7 text-white/72">{item.description ?? "Equipamiento seleccionado para jugadores que exigen precision, presencia y rendimiento."}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-lg font-semibold text-accent-soft">{formatMoney(item.basePrice)}</p>
        <p className="text-sm text-white/60">{item.stock && item.stock > 0 ? `${item.stock} disponibles` : "Stock por confirmar"}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(item.tags.length > 0 ? item.tags : ["premium", "seleccion curada"]).slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full border border-line px-3 py-1 text-xs text-white/68">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

export function HomeContent({ snapshot }: { snapshot: LandingSnapshot }) {
  const structuredData = getStructuredData(snapshot);

  return (
    <main className="relative isolate overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="mx-auto flex w-full max-w-7xl flex-col px-4 pb-14 pt-4 sm:px-6 sm:pb-16 sm:pt-6 lg:px-12 lg:pb-24">
        <div className="relative mb-6 hidden overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,14,0.98),rgba(7,10,14,0.92))] shadow-[0_36px_110px_rgba(3,6,10,0.42)] lg:block">
          <Image
            src={siteConfig.socialImage}
            alt="Portada principal de Billar en Linea"
            width={2000}
            height={800}
            sizes="1120px"
            className="h-auto w-full"
          />
        </div>

        <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,#0b0b0d_0%,#16181c_40%,#0b0b0d_100%)] text-white shadow-[0_40px_120px_rgba(3,6,10,0.42)] sm:rounded-[2.8rem]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_50%)] sm:bg-[radial-gradient(circle_at_top_left,rgba(246,196,79,0.22),transparent_24%),radial-gradient(circle_at_85%_16%,rgba(13,110,174,0.18),transparent_20%),radial-gradient(circle_at_50%_50%,rgba(13,110,174,0.14),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.02),transparent_50%)]" />
          <div className="absolute inset-y-0 right-0 hidden w-[32rem] bg-[radial-gradient(circle_at_center,rgba(246,196,79,0.16),transparent_55%)] lg:block" />

          <div className="relative px-4 py-5 sm:px-8 sm:py-6 lg:px-10">
            <nav className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-5" aria-label="Principal">
              <Link href="/" className="flex items-center gap-3 text-xs font-medium tracking-[0.18em] text-white/90 uppercase sm:text-sm">
                <Image
                  src="/logo_en_linea.png"
                  alt="Logo de Billar en Linea"
                  width={52}
                  height={52}
                  className="h-10 w-10 rounded-full border border-white/12 bg-black/25 object-cover p-0.5 sm:h-12 sm:w-12"
                />
                <span>Billar en Linea</span>
              </Link>

              <div className="hidden items-center gap-6 text-sm text-white/70 md:flex">
                <a className="transition hover:text-white" href="#servicios">Servicios</a>
                <a className="transition hover:text-white" href="#agenda">Agenda</a>
                <a className="transition hover:text-white" href="#noticias">Noticias</a>
                <a className="transition hover:text-white" href="#tienda">Tienda</a>
              </div>

              <div className="flex w-full items-center gap-3 sm:w-auto">
                <Link className="flex-1 rounded-full border border-white/15 px-4 py-2 text-center text-sm font-medium text-white/80 transition hover:bg-white/8 hover:text-white sm:flex-none" href="/login">
                  Entrar
                </Link>
                <Link className="flex-1 rounded-full bg-accent px-5 py-2 text-center text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong hover:text-white sm:flex-none" href="/register">
                  Registrarse
                </Link>
              </div>
            </nav>

            <div className="mt-10 space-y-10">
              <div className="max-w-3xl space-y-6 py-2 sm:space-y-7 lg:py-8">
                <div className="space-y-4">
                  <p className="font-mono text-xs uppercase tracking-[0.36em] text-accent drop-shadow-[0_0_10px_rgba(246,196,79,0.18)]">La plataforma que ordena la nueva escena del billar</p>
                  <h1 className="font-display text-[2.7rem] leading-[0.95] text-white [text-wrap:balance] sm:text-5xl lg:text-7xl">
                    Torneos, eventos, sorteos, noticias y tienda con presencia profesional.
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-white/72 sm:text-base lg:text-lg lg:leading-8">
                    Billar en Linea presenta la marca, mueve la agenda competitiva y conecta a la comunidad con contenido activo, oportunidades para jugar y una vitrina comercial pensada para crecer con el deporte.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link className="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-[#0B0B0D] transition-colors duration-300 hover:bg-accent-strong hover:text-[#0B0B0D] sm:w-auto" href="/register">
                    Crear cuenta ahora
                  </Link>
                  <a className="inline-flex w-full items-center justify-center rounded-full border border-white/12 px-6 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/8 sm:w-auto" href="#agenda">
                    Ver agenda activa
                  </a>
                </div>

                <div className="grid gap-4 pt-2 md:grid-cols-3">
                  <MetricCard
                    value={`${snapshot.totals.tournaments}+`}
                    label="Torneos"
                    note="Formatos competitivos pensados para ritmo, visibilidad y comunidad."
                  />
                  <MetricCard
                    value={`${snapshot.totals.events}+`}
                    label="Eventos"
                    note="Encuentros programados para activar publico, marcas y jugadores."
                  />
                  <div className="hidden md:block">
                    <MetricCard
                    value={`${snapshot.totals.posts + snapshot.totals.products}+`}
                    label="Contenido"
                    note="Noticias relevantes y tienda especializada en la misma experiencia."
                    />
                  </div>
                </div>
              </div>

              <div className="relative min-h-[24rem] max-w-5xl overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-4 sm:rounded-[2.25rem] sm:p-6 sm:backdrop-blur lg:p-8">
                <div className="absolute -left-10 top-12 hidden h-28 w-28 rounded-full bg-accent/30 blur-3xl sm:block" />
                <div className="absolute -right-10 bottom-0 hidden h-32 w-32 rounded-full bg-secondary/28 blur-3xl sm:block" />

                <div className="relative flex h-full flex-col justify-between gap-6">
                  <div className="rounded-[1.35rem] border border-white/10 bg-black/18 p-5 sm:rounded-[1.7rem] sm:p-6">
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-white/55">Manifiesto</p>
                    <p className="mt-4 font-display text-[2rem] leading-tight text-white sm:text-3xl lg:text-4xl">
                      Una mesa digital para descubrir, competir, informarse y comprar con criterio.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2 text-sm text-white/65">
                      <span className="rounded-full border border-white/10 px-3 py-1">Torneos abiertos</span>
                      <span className="rounded-full border border-white/10 px-3 py-1">Noticias en movimiento</span>
                      <span className="rounded-full border border-white/10 px-3 py-1">Sorteos vivos</span>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <article className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5">
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-white/50">Agenda viva</p>
                      <ul className="mt-4 space-y-4">
                        {(snapshot.tournaments.items.length > 0
                          ? snapshot.tournaments.items
                          : [
                              { id: "placeholder-1", name: "Cuadro principal por anunciar", image: null },
                              { id: "placeholder-2", name: "Inscripciones abiertas pronto", image: null },
                            ])
                          .slice(0, 2)
                          .map((item, index) => (
                            <li key={item.id} className={`overflow-hidden rounded-[1.2rem] border border-white/8 bg-black/16 ${index > 0 ? "hidden sm:block" : ""}`}>
                              <div className="relative h-28 w-full overflow-hidden border-b border-white/8 bg-[linear-gradient(135deg,rgba(246,196,79,0.18),rgba(13,110,174,0.16),rgba(22,24,28,0.92))]">
                                {item.image ? (
                                  <Image alt={item.name} className="object-cover" fill sizes="(max-width: 640px) 100vw, 280px" src={item.image} />
                                ) : (
                                  <div className="flex h-full items-end bg-[radial-gradient(circle_at_top_left,rgba(246,196,79,0.28),transparent_42%),linear-gradient(135deg,rgba(9,12,18,0.96),rgba(22,24,28,0.92))] p-4">
                                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-accent">Proximo evento</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D]/85 via-[#0B0B0D]/18 to-transparent" />
                              </div>
                              <div className="p-4 text-sm font-medium leading-6 text-white/82">
                                {item.name}
                              </div>
                            </li>
                          ))}
                      </ul>
                    </article>

                    <article className="hidden rounded-[1.5rem] border border-[rgba(246,196,79,0.26)] bg-[linear-gradient(135deg,rgba(246,196,79,0.22),rgba(13,110,174,0.14))] p-5 text-white shadow-[0_24px_50px_rgba(13,110,174,0.18)] lg:block">
                      <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-accent-soft">Lo que hacemos</p>
                      <p className="mt-4 text-2xl font-semibold leading-tight">
                        Presentamos la marca y damos contexto real a cada jornada del billar.
                      </p>
                      <p className="mt-4 text-sm leading-7 text-white/72">
                        Desde la experiencia publica hasta el contenido actualizado, cada bloque esta pensado para generar presencia y conversion.
                      </p>
                    </article>
                  </div>

                  <div className="hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(135deg,rgba(7,12,19,0.88),rgba(9,16,28,0.78))] p-5 sm:block">
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-accent-soft">Identidad visual</p>
                    <p className="mt-3 text-sm leading-7 text-white/72">
                      La portada principal ahora vive completa en la parte superior de la pagina, mientras este bloque sostiene el mensaje de marca, conversion y lectura rapida.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section id="servicios" className="defer-render grid gap-8 pb-16 pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:pb-18 lg:pt-18">
          <SectionHeading
            eyebrow="Quienes somos"
            title="Una portada para explicar la empresa sin sonar tecnica ni improvisada."
            description="La landing debe dejar claro que Billar en Linea no solo anuncia torneos: organiza la conversacion, da espacio a eventos y sorteos, mantiene informada a la comunidad y prepara la salida comercial con una tienda especializada."
          />

          <div className="space-y-5">
            <article className="rounded-[1.9rem] border border-line bg-[linear-gradient(135deg,rgba(9,15,23,0.96),rgba(6,10,16,0.92))] p-5 shadow-[0_26px_60px_rgba(5,7,10,0.3)] sm:p-8">
              <div className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr] xl:items-start">
                <div className="space-y-3">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-accent-soft">Agenda competitiva</p>
                  <h3 className="font-display text-3xl leading-none text-white sm:text-4xl lg:text-5xl">Torneos con lectura clara</h3>
                </div>
                <div className="space-y-4 text-white/72">
                  <p className="text-sm leading-7 sm:text-base sm:leading-8">
                    Calendario, formato, cupos, categorias y entradas presentados de forma comprensible para jugadores, publico y aliados.
                  </p>
                  <p className="font-subtitle text-sm uppercase tracking-[0.22em] text-white/48">
                    Competencia ordenada, inscripcion visible y presencia profesional.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-[1.9rem] border border-line bg-[linear-gradient(135deg,rgba(22,24,28,0.98),rgba(13,110,174,0.18))] p-5 text-white shadow-[0_28px_60px_rgba(13,110,174,0.16)] sm:p-8">
              <div className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr] xl:items-start">
                <div className="space-y-3">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-accent-soft">Contenido y notoriedad</p>
                  <h3 className="font-display text-3xl leading-none sm:text-4xl lg:text-5xl">Noticias y activaciones</h3>
                </div>
                <div className="space-y-4 text-white/72">
                  <p className="text-sm leading-7 sm:text-base sm:leading-8">
                    La marca se sostiene con actualidad, historias relevantes, transmisiones y momentos de comunidad que mantienen el sitio vivo mas alla del calendario.
                  </p>
                  <p className="font-subtitle text-sm uppercase tracking-[0.22em] text-white/48">
                    Informacion vigente, marca visible y comunidad conectada.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-[1.9rem] border border-line bg-[linear-gradient(135deg,rgba(22,24,28,0.96),rgba(11,11,13,0.94))] p-5 shadow-[0_26px_60px_rgba(246,196,79,0.08)] sm:p-8">
              <div className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr] xl:items-start">
                <div className="space-y-3">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-accent-soft">Tienda preparada</p>
                  <h3 className="font-display text-3xl leading-none text-white sm:text-4xl lg:text-5xl">Catalogo con peso comercial</h3>
                </div>
                <div className="space-y-4 text-white/72">
                  <p className="text-sm leading-7 sm:text-base sm:leading-8">
                    Productos elegidos para que la experiencia no termine en el torneo: tambien se convierta en compra, permanencia y relacion de marca.
                  </p>
                  <p className="font-subtitle text-sm uppercase tracking-[0.22em] text-white/48">
                    Accesorios, equipamiento y vitrina premium para la comunidad.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="agenda" className="defer-render space-y-8 pb-18">
          <SectionHeading
            eyebrow="Programacion"
            title="Lo que esta moviendo la mesa ahora mismo."
            description="Torneos, eventos y sorteos publicos construyen una portada util y creible. Cuando hay contenido real, la pagina se siente viva; cuando no, la experiencia sigue viendose curada."
          />

          <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr_0.95fr]">
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
                    title="Agenda en actualizacion"
                    body="La siguiente ventana competitiva ya esta entrando en curaduria. La estructura esta lista para mostrar torneos apenas publiquen los datos."
                  />
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[2rem] border border-line bg-[linear-gradient(180deg,rgba(7,12,20,0.98),rgba(10,16,24,0.92))] p-5 shadow-[0_28px_70px_rgba(5,8,14,0.28)]">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-accent-soft">Eventos</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Encuentros con identidad</h3>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/65">{snapshot.events.total}</span>
                </div>
                <div className="mt-5 grid gap-4">
                  {snapshot.events.items.length > 0 ? (
                    snapshot.events.items.map((item) => <EventCard key={item.id} item={item} />)
                  ) : (
                    <EmptyState
                      title="Eventos en curaduria"
                      body="Cuando entren nuevas fechas, este bloque mostrara encuentros destacados y experiencias alrededor del billar."
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(11,11,13,0.98),rgba(22,24,28,0.96))] p-5 shadow-[0_28px_75px_rgba(8,12,12,0.25)]">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-stone-500">Sorteos</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Activaciones que retienen</h3>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-stone-400">{snapshot.raffles.total}</span>
                </div>
                <div className="mt-5 grid gap-4">
                  {snapshot.raffles.items.length > 0 ? (
                    snapshot.raffles.items.map((item) => <RaffleCard key={item.id} item={item} />)
                  ) : (
                    <EmptyState
                      title="Sorteos por publicar"
                      body="El espacio queda listo para mostrar rifas activas y mantener la portada en movimiento sin degradar el look profesional."
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
              title="El billar nacional e internacional tambien necesita una portada editorial."
              description="La seccion de noticias ayuda al SEO, refuerza autoridad y evita que la marca se vea estatica. El contenido debe ayudar a entender la temporada, no solo a llenar espacio."
            />
            <div className="grid gap-5">
              {snapshot.posts.items.length > 0 ? (
                snapshot.posts.items.map((item) => <PostCard key={item.id} item={item} />)
              ) : (
                <EmptyState
                  title="Cobertura lista"
                  body="La estructura editorial ya puede recibir noticias, cronicas y piezas de contexto para ganar presencia en motores de busqueda."
                />
              )}
            </div>
          </div>

          <div id="tienda" className="space-y-8">
            <SectionHeading
              eyebrow="Tienda especializada"
              title="Una vitrina comercial que no compite con la experiencia: la completa."
              description="La tienda aparece integrada a la narrativa principal para que el usuario entienda la propuesta completa de Billar en Linea desde la primera visita."
            />
            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-1">
              {snapshot.products.items.length > 0 ? (
                snapshot.products.items.map((item) => <ProductCard key={item.id} item={item} />)
              ) : (
                <EmptyState
                  title="Catalogo en construccion"
                  body="La experiencia visual ya contempla productos destacados, precios y seleccion curada para cuando el catalogo publico este listo."
                />
              )}
            </div>
          </div>
        </section>

        <section className="defer-render relative overflow-hidden rounded-[2rem] border border-line bg-[linear-gradient(135deg,#13211f_0%,#0d1715_38%,#d59558_100%)] px-4 py-8 text-white shadow-[0_34px_100px_rgba(12,17,16,0.24)] sm:rounded-[2.7rem] sm:px-6 sm:py-10 lg:px-10 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.14),transparent_24%),linear-gradient(120deg,rgba(255,255,255,0.04),transparent_34%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-8">
            <div className="max-w-3xl space-y-4">
              <p className="font-mono text-xs uppercase tracking-[0.34em] text-accent-soft">Cierre de conversion</p>
              <h2 className="font-display text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">Haz que la primera impresion de Billar en Linea tenga peso de marca y recorrido de negocio.</h2>
              <p className="text-sm leading-7 text-white/75 sm:text-base lg:text-lg lg:leading-8">
                Registra usuarios, presenta tus servicios y gana relevancia en buscadores con una portada que ya habla el idioma del billar y no el del entorno tecnico.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link className="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-[#0B0B0D] transition-colors duration-300 hover:bg-accent-strong hover:text-[#0B0B0D] sm:w-auto" href="/register">
                Empezar con registro
              </Link>
              <Link className="inline-flex w-full items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/8 sm:w-auto" href="/login">
                Entrar a la plataforma
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}