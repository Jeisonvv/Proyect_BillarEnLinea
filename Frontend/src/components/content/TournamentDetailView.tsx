import Image from "next/image";
import Link from "next/link";
import type { TournamentDetail } from "@/lib/api/public-content";
import { TournamentRegistrationPanel } from "./TournamentRegistrationPanel";
import { formatMoney, humanizeToken } from "./utils";

function formatLongDate(value: string | null) {
  if (!value) {
    return "Por anunciar";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(parsed);
}

function getRegistrantInitial(name: string | null) {
  return (name ?? "?").trim().charAt(0).toUpperCase() || "?";
}

export function TournamentDetailView({ tournament }: { tournament: TournamentDetail }) {
  const locationLabel = [tournament.venueName, tournament.city, tournament.country].filter(Boolean).join(" · ");
  const confirmedLabel = tournament.currentParticipants !== null && tournament.maxParticipants !== null
    ? `${tournament.currentParticipants}/${tournament.maxParticipants} confirmados`
    : "Cupos por confirmar";
  const registrationsLabel = tournament.totalRegistrations !== null
    ? `${tournament.totalRegistrations} inscritos`
    : `${tournament.registrations.length} inscritos`;
  const confirmedRegistrationsLabel = tournament.confirmedRegistrations !== null
    ? `${tournament.confirmedRegistrations} confirmados`
    : confirmedLabel;
  const isOpen = tournament.status === "OPEN";
  const isFull = tournament.currentParticipants !== null
    && tournament.maxParticipants !== null
    && tournament.currentParticipants >= tournament.maxParticipants;

  return (
    <main className="mx-auto grid w-full max-w-[1500px] gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] xl:px-10 2xl:px-14">
      <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,13,18,0.98),rgba(13,17,24,0.96))] shadow-[0_28px_100px_rgba(0,0,0,0.36)]">
        <div className="relative h-[20rem] overflow-hidden border-b border-white/10 bg-black/30 sm:h-[24rem] lg:h-[30rem]">
          {tournament.image ? (
            <Image
              src={tournament.image}
              alt={`Imagen del torneo ${tournament.name}`}
              fill
              priority
              sizes="(min-width: 1536px) 55vw, (min-width: 1280px) 58vw, 100vw"
              className="object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(246,196,79,0.18),rgba(13,110,174,0.18),rgba(255,255,255,0.03))]" />
          )}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,12,0.18),rgba(7,9,12,0.34),rgba(7,9,12,0.94))]" />

          <div className="absolute left-5 right-5 top-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-emerald-300/22 bg-emerald-400/12 px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.26em] text-emerald-100 backdrop-blur-sm">
              {humanizeToken(tournament.status)}
            </span>
            <span className="rounded-full border border-white/14 bg-black/28 px-3 py-1 text-[0.72rem] font-semibold text-white/88 backdrop-blur-sm">
              {humanizeToken(tournament.format)}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 xl:p-8">
            <div className="max-w-3xl space-y-4">
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.34em] text-[rgba(246,196,79,0.82)]">Torneo Billar En Linea</p>
              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl xl:text-5xl">{tournament.name}</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                {tournament.shortDescription ?? tournament.description ?? "Detalle del torneo disponible próximamente."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-5 sm:p-7 xl:p-8">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[1.45rem] border border-white/8 bg-white/6 p-4">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-white/44">Inicio</p>
              <p className="mt-3 text-sm leading-7 text-white/88">{formatLongDate(tournament.startDate)}</p>
            </article>
            <article className="rounded-[1.45rem] border border-white/8 bg-white/6 p-4">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-white/44">Cierre inscripción</p>
              <p className="mt-3 text-sm leading-7 text-white/88">{formatLongDate(tournament.registrationDeadline)}</p>
            </article>
            <article className="rounded-[1.45rem] border border-white/8 bg-white/6 p-4">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-white/44">Inscripción</p>
              <p className="mt-3 text-sm leading-7 text-white/88">{formatMoney(tournament.entryFee)}</p>
            </article>
            <article className="rounded-[1.45rem] border border-white/8 bg-white/6 p-4">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-white/44">Participación</p>
              <p className="mt-3 text-sm leading-7 text-white/88">{confirmedLabel}</p>
            </article>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)]">
            <div className="space-y-6">
              <section className="rounded-[1.8rem] border border-white/8 bg-white/5 p-5">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Resumen</p>
                <p className="mt-4 text-sm leading-8 text-white/78 sm:text-base">
                  {tournament.description ?? "Este torneo aún no tiene descripción ampliada publicada."}
                </p>
              </section>

              <section className="rounded-[1.8rem] border border-white/8 bg-white/5 p-5">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Formato</p>
                <p className="mt-4 text-sm leading-8 text-white/78 sm:text-base">
                  {tournament.formatDetails ?? humanizeToken(tournament.format)}
                </p>
              </section>

              {tournament.prizes.length > 0 ? (
                <section className="rounded-[1.8rem] border border-white/8 bg-white/5 p-5">
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Premiación</p>
                  <div className="mt-4 grid gap-3">
                    {tournament.prizes.map((prize) => (
                      <article key={`${prize.position}-${prize.description}`} className="rounded-[1.25rem] border border-white/8 bg-black/18 p-4">
                        <p className="text-sm font-semibold text-white">Puesto {prize.position}</p>
                        <p className="mt-2 text-sm leading-7 text-white/74">{prize.description}</p>
                        {prize.amount !== null ? <p className="mt-2 text-sm text-[rgba(246,196,79,0.92)]">{formatMoney(prize.amount)}</p> : null}
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="grid gap-4 self-start">
              <div className="flex flex-wrap gap-3">
                <Link className="inline-flex rounded-full border border-white/10 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12" href="/home">
                  Volver al home
                </Link>
                {tournament.streamUrl ? (
                  <Link className="inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#0b0b0d] transition hover:bg-accent-strong" href={tournament.streamUrl} target="_blank" rel="noreferrer">
                    Ver transmisión
                  </Link>
                ) : null}
              </div>

              <TournamentRegistrationPanel
                tournamentId={tournament.id}
                isOpen={isOpen}
                isFull={isFull}
                registrations={tournament.registrations}
              />

              <section className="rounded-[1.8rem] border border-white/8 bg-white/5 p-5">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Sede</p>
                <p className="mt-4 text-sm leading-7 text-white/78">{locationLabel || "Ubicación por anunciar"}</p>
                {tournament.address ? <p className="mt-2 text-sm leading-7 text-white/62">{tournament.address}</p> : null}
              </section>

              {tournament.allowedCategories.length > 0 ? (
                <section className="rounded-[1.8rem] border border-white/8 bg-white/5 p-5">
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Categorías</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tournament.allowedCategories.map((category) => (
                      <span key={category} className="rounded-full border border-white/10 bg-black/24 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/82">
                        {humanizeToken(category)}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              {tournament.contactPhone ? (
                <section className="rounded-[1.8rem] border border-white/8 bg-white/5 p-5">
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Contacto</p>
                  <p className="mt-4 text-sm leading-7 text-white/78">{tournament.contactPhone}</p>
                </section>
              ) : null}
            </aside>
          </div>

          <section className="overflow-hidden rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">Inscritos</p>
                <p className="mt-3 text-sm leading-7 text-white/74 sm:text-base">
                  Consulta quiénes ya reservaron cupo, en qué estado está su inscripción y la categoría con la que entran al torneo.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <span className="rounded-full border border-white/10 bg-black/24 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/82">
                  {registrationsLabel}
                </span>
                <span className="rounded-full border border-emerald-300/18 bg-emerald-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                  {confirmedRegistrationsLabel}
                </span>
              </div>
            </div>

            {tournament.registrations.length > 0 ? (
              <div className="relative mt-6 overflow-hidden rounded-[1.5rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(11,18,33,0.94),rgba(7,11,18,0.96))] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[4.25rem] bg-[linear-gradient(180deg,rgba(39,52,85,0.96),rgba(31,42,70,0.96))]" />
                <div className="relative overflow-x-auto">
                  <div className="min-w-[780px] w-full border-b border-white/8">
                    <div className="grid h-[4.25rem] grid-cols-[4rem_minmax(16rem,2.4fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(9.5rem,auto)] items-stretch gap-4 px-5 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[rgba(255,227,163,0.96)]">
                      <div className="flex items-center">#</div>
                      <div className="flex items-center">Jugador</div>
                      <div className="flex items-center">Categoría</div>
                      <div className="flex items-center">Estado</div>
                      <div className="flex items-center justify-end whitespace-nowrap pr-3">Registro</div>
                    </div>
                  </div>

                  <div className="min-w-[780px] w-full divide-y divide-white/8 bg-[linear-gradient(180deg,rgba(12,18,30,0.9),rgba(8,12,20,0.96))] text-white">
                {tournament.registrations.map((registration, index) => {
                  const displayName = registration.user?.name ?? "Jugador registrado";
                  const category = registration.playerCategory ?? registration.user?.playerCategory ?? null;
                  const avatarUrl = registration.user?.avatarUrl ?? null;

                  return (
                    <article key={registration.id} className="grid grid-cols-[4rem_minmax(16rem,2.4fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(9.5rem,auto)] items-center gap-4 px-5 py-5">
                      <div className="text-xl font-semibold text-white/82">{index + 1}</div>

                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[rgba(246,196,79,0.32)] bg-[linear-gradient(180deg,rgba(28,40,66,0.96),rgba(18,27,47,0.98))] shadow-[0_10px_24px_rgba(20,29,49,0.14)]">
                            {avatarUrl ? (
                              <Image
                                src={avatarUrl}
                                alt={`Avatar de ${displayName}`}
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[rgba(255,239,202,0.96)] md:text-sm">
                                {getRegistrantInitial(displayName)}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[1.02rem] font-semibold text-white">{displayName}</p>
                            <p className="mt-1 truncate text-[0.78rem] text-white/48">
                              {registration.notes || "Inscripción registrada en el torneo"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        {category ? (
                          <span className="inline-flex rounded-full border border-[rgba(246,196,79,0.26)] bg-[rgba(246,196,79,0.14)] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[rgba(255,233,174,0.96)]">
                            {humanizeToken(category)}
                          </span>
                        ) : (
                          <span className="text-sm text-white/48">Por definir</span>
                        )}
                      </div>

                      <div>
                        <span className="inline-flex rounded-full bg-[rgba(255,255,255,0.06)] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/74">
                          {humanizeToken(registration.status)}
                        </span>
                      </div>

                      <div className="flex items-center justify-end pr-3">
                        <span className="inline-flex rounded-[1rem] bg-[linear-gradient(180deg,#f6c44f,#e79f14)] px-3.5 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[#18233f] shadow-[0_10px_24px_rgba(231,159,20,0.24)] md:px-4 md:py-2.5 md:text-[0.74rem]">
                          Activo
                        </span>
                      </div>
                    </article>
                  );
                })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[1.4rem] border border-dashed border-white/12 bg-black/18 px-4 py-5 text-sm leading-7 text-white/58">
                Aún no hay inscritos registrados para este torneo.
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}