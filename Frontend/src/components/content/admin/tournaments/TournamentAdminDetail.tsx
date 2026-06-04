"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import {
  AdminDeleteItemButton,
  AdminSectionScaffold,
  formatAdminDate,
  getErrorMessage,
  humanizeAdminToken,
} from "@/components/content/admin/shared";
import {
  PAYMENT_METHODS,
  REGISTRATION_PLAYER_CATEGORIES,
  TOURNAMENT_REGISTRATION_STATUSES,
  TOURNAMENT_STATUSES,
  updateTournamentAdmin,
  updateTournamentHandicapAdmin,
  updateTournamentRegistrationPlayerCategoryAdmin,
  updateTournamentRegistrationStatusAdmin,
  type PaymentMethod,
  type RegistrationPlayerCategory,
  type TournamentRegistrationStatus,
  type TournamentStatus,
} from "@/lib/api/admin-tournaments";
import type { TournamentDetail } from "@/lib/api/public-content";

type FeedbackState = {
  kind: "idle" | "success" | "error";
  message?: string;
};

const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  WAITLIST: "Lista de espera",
};

function toOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toOptionalDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function toOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const pad = (segment: number) => String(segment).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

function formatGroupStageSlotsValue(slots: TournamentDetail["groupStageSlots"]) {
  if (!slots.length) {
    return "";
  }

  return slots
    .map((slot) => {
      const date = slot.date ? slot.date.slice(0, 10) : "";
      const parts = [date, slot.startTime ?? ""];

      if (slot.endTime) {
        parts.push(slot.endTime);
      }

      if (slot.label) {
        parts.push(slot.label);
      }

      return parts.filter(Boolean).join(",");
    })
    .filter(Boolean)
    .join("\n");
}

function parseGroupStageSlotsInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const slots = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [dateValue, startTime, thirdPart, ...labelParts] = line.split(",").map((part) => part.trim());

      if (!dateValue || !startTime) {
        throw new Error(`La franja ${index + 1} debe usar el formato fecha,horaInicio,horaFin opcional,etiqueta opcional.`);
      }

      const date = new Date(`${dateValue}T00:00`);
      if (Number.isNaN(date.getTime())) {
        throw new Error(`La fecha de la franja ${index + 1} no es válida.`);
      }

      const looksLikeTime = typeof thirdPart === "string" && /^\d{2}:\d{2}$/.test(thirdPart);
      const endTime = looksLikeTime ? thirdPart : undefined;
      const normalizedLabelParts = [
        ...(looksLikeTime ? labelParts : thirdPart ? [thirdPart, ...labelParts] : labelParts),
      ];

      return {
        date: date.toISOString(),
        startTime,
        ...(endTime ? { endTime } : {}),
        ...(normalizedLabelParts.join(", ") ? { label: normalizedLabelParts.join(", ") } : {}),
      };
    });

  return slots.length > 0 ? slots : undefined;
}

function parseTags(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function getRegistrationStatusLabel(status: string | null | undefined) {
  if (!status) {
    return "Sin estado";
  }

  return REGISTRATION_STATUS_LABELS[status] ?? status;
}

function getRegistrationStatusBadgeClass(status: string | null | undefined) {
  switch (status) {
    case "CONFIRMED":
      return "border-emerald-300/24 bg-emerald-400/12 text-emerald-100";
    case "WAITLIST":
      return "border-sky-300/24 bg-sky-400/12 text-sky-100";
    case "CANCELLED":
      return "border-rose-300/24 bg-rose-400/12 text-rose-100";
    case "PENDING":
    default:
      return "border-[rgba(246,196,79,0.18)] bg-[rgba(246,196,79,0.1)] text-[rgba(255,233,174,0.96)]";
  }
}

function updateRegistrationInState(
  registrations: TournamentDetail["registrations"],
  registrationId: string,
  patch: Partial<TournamentDetail["registrations"][number]>,
) {
  return registrations.map((registration) => (
    registration.id === registrationId
      ? { ...registration, ...patch }
      : registration
  ));
}

export function TournamentAdminDetail({ initialTournament }: { initialTournament: TournamentDetail }) {
  const router = useRouter();
  const [tournament, setTournament] = useState(initialTournament);
  const [editorFeedback, setEditorFeedback] = useState<FeedbackState>({ kind: "idle" });
  const [registrationFeedback, setRegistrationFeedback] = useState<Record<string, FeedbackState>>({});
  const [expandedRegistrationId, setExpandedRegistrationId] = useState<string | null>(null);
  const [activeRegistrationId, setActiveRegistrationId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalRegistrations = tournament.totalRegistrations ?? tournament.registrations.length;
  const confirmedRegistrations = tournament.confirmedRegistrations ?? tournament.registrations.filter((item) => item.status === "CONFIRMED").length;

  function handleTournamentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        const response = await updateTournamentAdmin(tournament.id, {
          name: toOptionalString(formData.get("name")),
          status: (toOptionalString(formData.get("status")) as TournamentStatus | undefined),
          entryFee: toOptionalNumber(formData.get("entryFee")),
          maxParticipants: toOptionalNumber(formData.get("maxParticipants")),
          description: toOptionalString(formData.get("description")),
          shortDescription: toOptionalString(formData.get("shortDescription")),
          formatDetails: toOptionalString(formData.get("formatDetails")),
          startDate: toOptionalDate(formData.get("startDate")),
          endDate: toOptionalDate(formData.get("endDate")),
          registrationDeadline: toOptionalDate(formData.get("registrationDeadline")),
          discount20Deadline: toOptionalDate(formData.get("discount20Deadline")),
          discount10Deadline: toOptionalDate(formData.get("discount10Deadline")),
          groupStageSlots: parseGroupStageSlotsInput(String(formData.get("groupStageSlotsText") ?? "")),
          venueName: toOptionalString(formData.get("venueName")),
          location: toOptionalString(formData.get("location")),
          address: toOptionalString(formData.get("address")),
          city: toOptionalString(formData.get("city")),
          country: toOptionalString(formData.get("country")),
          streamUrl: toOptionalString(formData.get("streamUrl")),
          imageUrl: toOptionalString(formData.get("imageUrl")),
          contactPhone: toOptionalString(formData.get("contactPhone")),
          seoTitle: toOptionalString(formData.get("seoTitle")),
          seoDescription: toOptionalString(formData.get("seoDescription")),
          tags: parseTags(formData.get("tags")),
        });

        setTournament((current) => ({
          ...current,
          name: response.data.name ?? current.name,
          slug: response.data.slug ?? current.slug,
          description: response.data.description ?? null,
          shortDescription: response.data.shortDescription ?? null,
          seoTitle: response.data.seoTitle ?? null,
          seoDescription: response.data.seoDescription ?? null,
          formatDetails: response.data.formatDetails ?? null,
          status: response.data.status ?? current.status,
          startDate: response.data.startDate ?? null,
          endDate: response.data.endDate ?? null,
          registrationDeadline: response.data.registrationDeadline ?? null,
          discount20Deadline: response.data.discount20Deadline ?? null,
          discount10Deadline: response.data.discount10Deadline ?? null,
          entryFee: response.data.entryFee ?? current.entryFee,
          maxParticipants: response.data.maxParticipants ?? current.maxParticipants,
          groupStageSlots: response.data.groupStageSlots ?? current.groupStageSlots,
          venueName: response.data.venueName ?? null,
          location: response.data.location ?? null,
          address: response.data.address ?? null,
          city: response.data.city ?? null,
          country: response.data.country ?? null,
          streamUrl: response.data.streamUrl ?? null,
          image: response.data.imageUrl ?? current.image,
          contactPhone: response.data.contactPhone ?? null,
          tags: response.data.tags ?? [],
        }));

        if (response.data.slug && response.data.slug !== tournament.slug) {
          router.replace(`/admin/torneos/${response.data.slug}`);
        }

        setEditorFeedback({ kind: "success", message: "Cambios del torneo guardados." });
        router.refresh();
      } catch (error) {
        setEditorFeedback({ kind: "error", message: getErrorMessage(error) });
      }
    });
  }

  function handleRegistrationSubmit(event: FormEvent<HTMLFormElement>, registrationId: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const userId = String(formData.get("userId") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim() as TournamentRegistrationStatus;
    const handicapRaw = String(formData.get("handicap") ?? "").trim();
    const handicap = handicapRaw ? Number(handicapRaw) : null;
    const playerCategoryRaw = String(formData.get("playerCategory") ?? "").trim();
    const playerCategory = playerCategoryRaw ? (playerCategoryRaw as RegistrationPlayerCategory) : null;

    if (!userId) {
      setRegistrationFeedback((current) => ({
        ...current,
        [registrationId]: { kind: "error", message: "No se pudo identificar al jugador." },
      }));
      return;
    }

    startTransition(async () => {
      setActiveRegistrationId(registrationId);

      try {
        const statusResponse = await updateTournamentRegistrationStatusAdmin(tournament.id, userId, {
          status,
          paymentMethod: (toOptionalString(formData.get("paymentMethod")) as PaymentMethod | undefined),
          paymentReference: toOptionalString(formData.get("paymentReference")),
          paidAt: toOptionalDate(formData.get("paidAt")),
        });

        let nextRegistrations = updateRegistrationInState(tournament.registrations, registrationId, {
          status: statusResponse.data.status ?? status,
        });

        if (handicap !== null && Number.isFinite(handicap) && handicap >= 0) {
          const handicapResponse = await updateTournamentHandicapAdmin(tournament.id, userId, { handicap });
          nextRegistrations = updateRegistrationInState(nextRegistrations, registrationId, {
            handicap: handicapResponse.data.handicap ?? handicap,
            status: handicapResponse.data.status ?? statusResponse.data.status ?? status,
          });
        }

        const currentRegistration = tournament.registrations.find((item) => item.id === registrationId) ?? null;
        const currentCategory = currentRegistration?.playerCategory ?? currentRegistration?.user?.playerCategory ?? null;
        if (playerCategory && playerCategory !== currentCategory) {
          const categoryResponse = await updateTournamentRegistrationPlayerCategoryAdmin(tournament.id, userId, { playerCategory });
          nextRegistrations = updateRegistrationInState(nextRegistrations, registrationId, {
            playerCategory: categoryResponse.data.playerCategory ?? playerCategory,
            status: categoryResponse.data.status ?? nextRegistrations.find((item) => item.id === registrationId)?.status ?? status,
          });
        }

        const confirmedCount = nextRegistrations.filter((item) => item.status === "CONFIRMED").length;

        setTournament((current) => ({
          ...current,
          registrations: nextRegistrations,
          confirmedRegistrations: confirmedCount,
          currentParticipants: confirmedCount,
        }));

        setRegistrationFeedback((current) => ({
          ...current,
          [registrationId]: { kind: "success", message: "Jugador actualizado." },
        }));
        setExpandedRegistrationId(null);
        router.refresh();
      } catch (error) {
        setRegistrationFeedback((current) => ({
          ...current,
          [registrationId]: { kind: "error", message: getErrorMessage(error) },
        }));
      } finally {
        setActiveRegistrationId(null);
      }
    });
  }

  return (
    <AdminSectionScaffold
      kicker="Admin torneo"
      title={`Gestiona ${tournament.name}`}
      description="Esta URL administrativa concentra los cambios del torneo: contenido visible, agenda operativa, costo de inscripción, cupos y ajustes por jugador."
      primaryAction={{ label: "Volver a torneos", href: "/admin/torneos" }}
      secondaryAction={{ label: "Ver página pública", href: `/home/torneos/${tournament.slug}` }}
      metrics={[
        { label: "Estado", value: humanizeAdminToken(tournament.status), helper: "Ciclo actual del torneo." },
        { label: "Confirmados", value: String(confirmedRegistrations), helper: "Jugadores con cupo activo hoy." },
        { label: "Cupos máximos", value: String(tournament.maxParticipants ?? 0), helper: "Capacidad total configurada." },
        { label: "Inscritos", value: String(totalRegistrations), helper: "Registros totales visibles en la tabla." },
      ]}
    >
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Edición segura</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Datos del torneo</h2>
            </div>
            <div className="text-right text-sm text-white/58">
              <p>Formato: {humanizeAdminToken(tournament.format)}</p>
              <p>Inscripción: {tournament.entryFee ?? 0}</p>
            </div>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={handleTournamentSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white/72">
                Nombre
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.name} name="name" required />
              </label>
              <label className="grid gap-2 text-sm text-white/72">
                Estado
                <select className="rounded-2xl border border-white/10 bg-[#17191d] px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.status ?? "DRAFT"} name="status">
                  {TOURNAMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>{humanizeAdminToken(status)}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white/72">
                Costo de inscripción (COP)
                <input
                  className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent"
                  defaultValue={tournament.entryFee ?? 0}
                  min={0}
                  name="entryFee"
                  step="1000"
                  type="number"
                />
              </label>
              <label className="grid gap-2 text-sm text-white/72">
                Cupos máximos
                <input
                  className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent"
                  defaultValue={tournament.maxParticipants ?? 2}
                  min={2}
                  name="maxParticipants"
                  step="1"
                  type="number"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm text-white/72">
              Descripción corta
              <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.shortDescription ?? ""} name="shortDescription" />
            </label>

            <label className="grid gap-2 text-sm text-white/72">
              Descripción
              <textarea className="min-h-28 rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.description ?? ""} name="description" />
            </label>

            <label className="grid gap-2 text-sm text-white/72">
              Detalles del formato
              <textarea className="min-h-24 rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.formatDetails ?? ""} name="formatDetails" />
            </label>

            <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
              <label className="grid min-w-0 gap-2 text-sm text-white/72">
                Inicio
                <input className="min-w-0 w-full rounded-2xl border border-white/10 bg-white/8 px-3 py-2.5 text-sm text-white outline-none transition focus:border-accent" defaultValue={toDateTimeLocalValue(tournament.startDate)} name="startDate" type="datetime-local" step="60" />
                
              </label>
              <label className="grid min-w-0 gap-2 text-sm text-white/72">
                Fin
                <input className="min-w-0 w-full rounded-2xl border border-white/10 bg-white/8 px-3 py-2.5 text-sm text-white outline-none transition focus:border-accent" defaultValue={toDateTimeLocalValue(tournament.endDate)} name="endDate" type="datetime-local" step="60" />
              
              </label>
              <label className="grid min-w-0 gap-2 text-sm text-white/72 xl:col-span-2 2xl:col-span-1">
                Cierre inscripción
                <input className="min-w-0 w-full rounded-2xl border border-white/10 bg-white/8 px-3 py-2.5 text-sm text-white outline-none transition focus:border-accent" defaultValue={toDateTimeLocalValue(tournament.registrationDeadline)} name="registrationDeadline" type="datetime-local" step="60" />
               
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid min-w-0 gap-2 text-sm text-white/72">
                Límite descuento 20%
                <input
                  className="min-w-0 w-full rounded-2xl border border-white/10 bg-white/8 px-3 py-2.5 text-sm text-white outline-none transition focus:border-accent"
                  defaultValue={toDateTimeLocalValue(tournament.discount20Deadline)}
                  name="discount20Deadline"
                  type="datetime-local"
                  step="60"
                />
              </label>
              <label className="grid min-w-0 gap-2 text-sm text-white/72">
                Límite descuento 10%
                <input
                  className="min-w-0 w-full rounded-2xl border border-white/10 bg-white/8 px-3 py-2.5 text-sm text-white outline-none transition focus:border-accent"
                  defaultValue={toDateTimeLocalValue(tournament.discount10Deadline)}
                  name="discount10Deadline"
                  type="datetime-local"
                  step="60"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm text-white/72">
              Horarios de grupos
              <textarea
                className="min-h-28 rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent"
                defaultValue={formatGroupStageSlotsValue(tournament.groupStageSlots)}
                name="groupStageSlotsText"
                placeholder={"2026-06-13,16:00,19:00,Jornada tarde\n2026-06-14,09:00,12:00,Jornada manana"}
              />
              <span className="text-xs leading-6 text-white/48">Una franja por línea: fecha,horaInicio,horaFin opcional,etiqueta opcional.</span>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white/72">
                Sede
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.venueName ?? ""} name="venueName" />
              </label>
              <label className="grid gap-2 text-sm text-white/72">
                Ciudad
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.city ?? ""} name="city" />
              </label>
            </div>

            <label className="grid gap-2 text-sm text-white/72">
              Ubicación
              <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.location ?? ""} name="location" />
            </label>

            <label className="grid gap-2 text-sm text-white/72">
              Dirección
              <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.address ?? ""} name="address" />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white/72">
                País
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.country ?? "Colombia"} name="country" />
              </label>
              <label className="grid gap-2 text-sm text-white/72">
                Teléfono
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.contactPhone ?? ""} name="contactPhone" />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white/72">
                Stream URL
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.streamUrl ?? ""} name="streamUrl" />
              </label>
              <label className="grid gap-2 text-sm text-white/72">
                Imagen URL
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.image ?? ""} name="imageUrl" />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white/72">
                SEO title
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.seoTitle ?? ""} name="seoTitle" />
              </label>
              <label className="grid gap-2 text-sm text-white/72">
                Etiquetas
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.tags.join(", ")} name="tags" />
              </label>
            </div>

            <label className="grid gap-2 text-sm text-white/72">
              SEO description
              <textarea className="min-h-24 rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={tournament.seoDescription ?? ""} name="seoDescription" />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-sm text-white/56">URL admin: /admin/torneos/{tournament.slug}</p>
              <div className="flex flex-wrap items-center gap-3">
                <AdminDeleteItemButton
                  deletePath={`/api/tournaments/${tournament.id}`}
                  itemLabel="torneo"
                  itemName={tournament.name}
                  redirectTo="/admin/torneos"
                  consequences={[
                    "Se eliminarán los datos operativos y competitivos vinculados a este torneo.",
                    "Los jugadores inscritos dejarán de aparecer en el panel y en el detalle público.",
                    "Los pagos asociados a inscripciones del torneo también serán removidos.",
                  ]}
                  description={
                    <>
                      Vas a eliminar <span className="font-semibold text-white">{tournament.name}</span>. Esta acción borrará también sus grupos,
                      inscripciones, partidos y transacciones asociadas. No se puede deshacer.
                    </>
                  }
                  successMessage="Torneo eliminado correctamente."
                />
                <button className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70" disabled={isPending} type="submit">
                  {isPending && !activeRegistrationId ? "Guardando..." : "Guardar torneo"}
                </button>
              </div>
            </div>

            {editorFeedback.kind !== "idle" ? (
              <p className={editorFeedback.kind === "error" ? "text-sm text-rose-300" : "text-sm text-emerald-300"}>{editorFeedback.message}</p>
            ) : null}
          </form>
        </section>

        <section className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Campos de referencia</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Configuración estructural</h2>
          <div className="mt-5 grid gap-3">
            {[
              `Formato: ${humanizeAdminToken(tournament.format)}`,
              `Mesas por grupos: ${tournament.groupStageTables ?? 0}`,
              `Jugadores por grupo: ${tournament.playersPerGroup ?? 0}`,
              `Horarios de grupos: ${tournament.groupStageSlots.length}`,
            ].map((item) => (
              <div key={item} className="rounded-[1.2rem] border border-white/8 bg-black/18 px-4 py-3 text-sm text-white/72">{item}</div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.3rem] border border-[rgba(246,196,79,0.18)] bg-[rgba(246,196,79,0.08)] p-4 text-sm leading-7 text-[rgba(255,244,214,0.86)]">
            Desde esta vista puedes cambiar contenido, estado operativo, costo de inscripción y cupos máximos. Si reduces cupos, no puede quedar por debajo de los jugadores ya confirmados.
          </div>

          <div className="mt-6 grid gap-3 text-sm text-white/62">
            <p>Inicio visible: {formatAdminDate(tournament.startDate)}</p>
            <p>Cierre visible: {formatAdminDate(tournament.registrationDeadline)}</p>
            <Link className="text-[#f6c44f] transition hover:text-white" href={`/home/torneos/${tournament.slug}`}>
              Abrir detalle público del torneo
            </Link>
          </div>
        </section>
      </div>

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Inscripciones</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Gestión por jugador</h2>
          </div>
          <p className="text-sm text-white/58">Selecciona un jugador de la lista y abre su edición solo cuando la necesites.</p>
        </div>

        <div className="overflow-hidden rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))]">
          {tournament.registrations.length > 0 ? (
            <>
              <div className="hidden sticky top-0 z-10 grid-cols-[minmax(15rem,2fr)_minmax(7rem,0.8fr)_minmax(7rem,0.8fr)_minmax(11rem,1fr)_auto] gap-4 border-b border-white/8 bg-[linear-gradient(180deg,rgba(16,19,27,0.96),rgba(16,19,27,0.92))] px-5 py-4 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/42 backdrop-blur sm:grid">
                <div>Jugador</div>
                <div>Categoría</div>
                <div>Estado</div>
                <div>Registro</div>
                <div className="text-right">Acción</div>
              </div>

              {tournament.registrations.map((registration) => {
            const userId = registration.user?.id ?? "";
            const feedback = registrationFeedback[registration.id] ?? { kind: "idle" as const };
            const isExpanded = expandedRegistrationId === registration.id;

            return (
              <div key={registration.id} className="border-b border-white/8 last:border-b-0">
                <form
                  className="px-4 py-4 sm:px-5"
                  onSubmit={(event) => handleRegistrationSubmit(event, registration.id)}
                >
                  <input name="userId" type="hidden" value={userId} />

                  <div className="grid gap-3 py-1 sm:grid-cols-[minmax(15rem,2fr)_minmax(7rem,0.8fr)_minmax(7rem,0.8fr)_minmax(11rem,1fr)_auto] sm:items-center sm:gap-4">
                    <div>
                      <p className="text-base font-semibold text-white">{registration.user?.name ?? "Jugador registrado"}</p>
                      <p className="mt-1 text-sm text-white/56">{registration.user?.phone ?? registration.notes ?? "Sin notas adicionales"}</p>
                    </div>

                    <div>
                      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-white/42 sm:hidden">Categoría</p>
                      <span className="mt-1 inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/78">{humanizeAdminToken(registration.playerCategory ?? registration.user?.playerCategory ?? null)}</span>
                    </div>

                    <div>
                      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-white/42 sm:hidden">Estado</p>
                      <span className={`mt-1 inline-flex rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] ${getRegistrationStatusBadgeClass(registration.status)}`}>{getRegistrationStatusLabel(registration.status)}</span>
                    </div>

                    <div>
                      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-white/42 sm:hidden">Registro</p>
                      <p className="mt-1 text-sm font-medium text-white/82">{formatAdminDate(registration.createdAt)}</p>
                    </div>

                    <div className="flex justify-start sm:justify-end">
                      <button
                        className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/78 transition hover:border-[rgba(246,196,79,0.24)] hover:bg-white/6 hover:text-white"
                        type="button"
                        onClick={() => setExpandedRegistrationId((current) => current === registration.id ? null : registration.id)}
                      >
                        {isExpanded ? "Ocultar" : "Editar"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/58">
                    <span>Handicap: <span className="font-semibold text-white/86">{registration.handicap ?? "Sin definir"}</span></span>
                  </div>

                  {isExpanded ? (
                    <div className="mt-5 rounded-[1.3rem] border border-white/8 bg-black/18 p-4">
                      <div className="grid gap-4 lg:grid-cols-4">
                        <label className="grid gap-2 text-sm text-white/72">
                          Estado
                          <select className="rounded-2xl border border-white/10 bg-[#17191d] px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={registration.status ?? "PENDING"} name="status">
                            {TOURNAMENT_REGISTRATION_STATUSES.map((status) => (
                              <option key={status} value={status}>{getRegistrationStatusLabel(status)}</option>
                            ))}
                          </select>
                        </label>

                        <label className="grid gap-2 text-sm text-white/72">
                          Categoría
                          <select
                            className="rounded-2xl border border-white/10 bg-[#17191d] px-4 py-3 text-white outline-none transition focus:border-accent"
                            defaultValue={registration.playerCategory ?? registration.user?.playerCategory ?? "SIN_DEFINIR"}
                            name="playerCategory"
                          >
                            {REGISTRATION_PLAYER_CATEGORIES.map((category) => (
                              <option key={category} value={category}>{humanizeAdminToken(category)}</option>
                            ))}
                          </select>
                        </label>

                        <label className="grid gap-2 text-sm text-white/72">
                          Handicap
                          <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={registration.handicap ?? ""} min={0} name="handicap" step="1" type="number" />
                        </label>

                        <label className="grid gap-2 text-sm text-white/72">
                          Método de pago
                          <select className="rounded-2xl border border-white/10 bg-[#17191d] px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue="" name="paymentMethod">
                            <option value="">Sin registrar</option>
                            {PAYMENT_METHODS.map((method) => (
                              <option key={method} value={method}>{humanizeAdminToken(method)}</option>
                            ))}
                          </select>
                        </label>

                        <label className="grid gap-2 text-sm text-white/72">
                          Fecha de pago
                          <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" name="paidAt" type="date" />
                        </label>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                        <label className="grid gap-2 text-sm text-white/72">
                          Referencia o nota de pago
                          <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" name="paymentReference" placeholder="Pago recibido por transferencia o presencial" />
                        </label>

                        <button className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70" disabled={isPending && activeRegistrationId === registration.id} type="submit">
                          {isPending && activeRegistrationId === registration.id ? "Guardando..." : "Guardar jugador"}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {feedback.kind !== "idle" ? (
                    <p className={feedback.kind === "error" ? "mt-3 text-sm text-rose-300" : "mt-3 text-sm text-emerald-300"}>{feedback.message}</p>
                  ) : null}
                </form>
              </div>
            );
          })}
            </>
          ) : (
            <p className="px-4 py-4 text-sm leading-7 text-white/62 sm:px-5">Todavía no hay inscritos en este torneo.</p>
          )}
        </div>
      </section>
    </AdminSectionScaffold>
  );
}