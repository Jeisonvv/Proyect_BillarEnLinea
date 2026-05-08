"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { AdminDeleteItemButton, AdminSectionScaffold, formatAdminDate, formatAdminMoney, humanizeAdminToken } from "@/components/content/admin/shared";
import { EVENT_STATUSES, updateEventAdmin, type EventStatus } from "@/lib/api/admin-events";
import type { EventDetail } from "@/lib/api/public-content";

type FeedbackState = {
  kind: "idle" | "success" | "error";
  message?: string;
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

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible completar la operación.";
}

export function EventAdminDetail({ initialEvent }: { initialEvent: EventDetail }) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [feedback, setFeedback] = useState<FeedbackState>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const form = formEvent.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        const response = await updateEventAdmin(event.id, {
          name: toOptionalString(formData.get("name")),
          type: toOptionalString(formData.get("type")),
          tier: toOptionalString(formData.get("tier")),
          status: toOptionalString(formData.get("status")) as EventStatus | undefined,
          startDate: toOptionalDate(formData.get("startDate")),
          endDate: toOptionalDate(formData.get("endDate")),
          entryFee: toOptionalNumber(formData.get("entryFee")),
          featured: Boolean(formData.get("featured")),
          seoTitle: toOptionalString(formData.get("seoTitle")),
          seoDescription: toOptionalString(formData.get("seoDescription")),
        });

        setEvent((current) => ({
          ...current,
          slug: response.data.slug ?? current.slug,
          name: response.data.name ?? current.name,
          type: response.data.type ?? current.type,
          tier: response.data.tier ?? current.tier,
          status: response.data.status ?? current.status,
          startDate: response.data.startDate ?? current.startDate,
          endDate: response.data.endDate ?? current.endDate,
          entryFee: response.data.entryFee ?? current.entryFee,
          featured: response.data.featured ?? current.featured,
          seoTitle: response.data.seoTitle ?? current.seoTitle,
          seoDescription: response.data.seoDescription ?? current.seoDescription,
        }));

        if (response.data.slug && response.data.slug !== event.slug) {
          router.replace(`/admin/eventos/${response.data.slug}`);
        }

        setFeedback({ kind: "success", message: "Cambios del evento guardados." });
        router.refresh();
      } catch (error) {
        setFeedback({ kind: "error", message: getErrorMessage(error) });
      }
    });
  }

  return (
    <AdminSectionScaffold
      kicker="Admin evento"
      title={`Gestiona ${event.name}`}
      description="Esta vista concentra los ajustes seguros del evento: programación, estado visible y señales editoriales clave. Los datos de contexto público quedan visibles a la derecha para validar rápidamente lo que ya está publicado."
      primaryAction={{ label: "Volver a eventos", href: "/admin/eventos" }}
      secondaryAction={{ label: "Ver página pública", href: `/home/eventos/${event.slug}` }}
      metrics={[
        { label: "Estado", value: humanizeAdminToken(event.status), helper: "Situación operativa actual del evento." },
        { label: "Inicio", value: formatAdminDate(event.startDate), helper: "Fecha visible para la agenda pública." },
        { label: "Costo", value: formatAdminMoney(event.entryFee), helper: "Valor configurado para acceso o inscripción." },
        { label: "Destacado", value: event.featured ? "Sí" : "No", helper: "Indica si el evento resalta en listados." },
      ]}
    >
      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Edición segura</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Datos del evento</h2>
            </div>
            <div className="text-right text-sm text-white/58">
              <p>Tipo: {humanizeAdminToken(event.type)}</p>
              <p>Tier: {humanizeAdminToken(event.tier)}</p>
            </div>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white/72">
                Nombre
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={event.name} name="name" required />
              </label>
              <label className="grid gap-2 text-sm text-white/72">
                Estado
                <select className="rounded-2xl border border-white/10 bg-[#17191d] px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={event.status ?? "DRAFT"} name="status">
                  {EVENT_STATUSES.map((status) => (
                    <option key={status} value={status}>{humanizeAdminToken(status)}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white/72">
                Tipo
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={event.type ?? ""} name="type" placeholder="Ej. OPEN, EXHIBITION" />
              </label>
              <label className="grid gap-2 text-sm text-white/72">
                Tier
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={event.tier ?? ""} name="tier" placeholder="Ej. PRO, AMATEUR" />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm text-white/72">
                Inicio
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={toDateInputValue(event.startDate)} name="startDate" type="date" />
              </label>
              <label className="grid gap-2 text-sm text-white/72">
                Fin
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={toDateInputValue(event.endDate)} name="endDate" type="date" />
              </label>
              <label className="grid gap-2 text-sm text-white/72">
                Valor
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={event.entryFee ?? ""} min="0" name="entryFee" step="1000" type="number" />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-black/18 px-4 py-3 text-sm text-white/78">
              <input className="h-4 w-4 accent-(--color-accent)" defaultChecked={event.featured} name="featured" type="checkbox" />
              Marcar como evento destacado
            </label>

            <label className="grid gap-2 text-sm text-white/72">
              SEO title
              <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={event.seoTitle ?? ""} name="seoTitle" />
            </label>

            <label className="grid gap-2 text-sm text-white/72">
              SEO description
              <textarea className="min-h-24 rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-accent" defaultValue={event.seoDescription ?? ""} name="seoDescription" />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-sm">
                {feedback.kind !== "idle" ? (
                  <p className={feedback.kind === "error" ? "text-rose-300" : "text-emerald-300"}>{feedback.message}</p>
                ) : (
                  <p className="text-white/46">Guarda solo los campos que hoy están soportados por la API administrativa.</p>
                )}
              </div>
              <button className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70" disabled={isPending} type="submit">
                {isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>

        <div className="grid gap-4">
          <section className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] p-5">
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Lectura pública</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Contexto visible</h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[1.3rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Organiza</p>
                <p className="mt-2 text-base font-semibold text-white">{event.organizer ?? "Por definir"}</p>
              </div>
              <div className="rounded-[1.3rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Ubicación</p>
                <p className="mt-2 text-base font-semibold text-white">{event.location ?? "Sin sede"}</p>
                <p className="mt-1 text-sm text-white/56">{[event.city, event.department, event.country].filter(Boolean).join(", ") || "Ciudad pendiente"}</p>
              </div>
              <div className="rounded-[1.3rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Registro</p>
                <p className="mt-2 text-base font-semibold text-white">{humanizeAdminToken(event.registrationMode)}</p>
                <p className="mt-1 text-sm text-white/56">{event.registrationUrl ?? "Sin enlace de registro"}</p>
              </div>
              <div className="rounded-[1.3rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Taquilla</p>
                <p className="mt-2 text-base font-semibold text-white">{formatAdminMoney(event.ticketPrice)}</p>
                <p className="mt-1 text-sm text-white/56">{humanizeAdminToken(event.ticketingMode)}</p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.3rem] border border-white/8 bg-black/18 p-4">
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Descripción actual</p>
              <p className="mt-2 text-sm leading-7 text-white/68">{event.description ?? "Este evento no tiene descripción pública cargada."}</p>
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-rose-400/16 bg-[linear-gradient(180deg,rgba(50,16,22,0.28),rgba(16,10,16,0.32))] p-5">
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-rose-200/82">Zona destructiva</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Eliminar evento</h2>
            <p className="mt-3 text-sm leading-7 text-white/68">
              Úsalo solo cuando la publicación ya no deba existir ni en panel ni en detalle público.
            </p>

            <div className="mt-5">
              <AdminDeleteItemButton
                deletePath={`/api/events/${event.id}`}
                itemLabel="evento"
                itemName={event.name}
                redirectTo="/admin/eventos"
                consequences={[
                  "El evento dejará de aparecer en el panel administrativo y en la vista pública.",
                  "La URL pública del evento dejará de resolver su detalle.",
                  "Esta acción es definitiva y no se puede deshacer.",
                ]}
                description={
                  <>
                    Vas a eliminar <span className="font-semibold text-white">{event.name}</span>. Revisa que no haya difusión activa ni enlaces compartidos antes de continuar.
                  </>
                }
                successMessage="Evento eliminado correctamente."
              />
            </div>
          </section>
        </div>
      </div>
    </AdminSectionScaffold>
  );
}