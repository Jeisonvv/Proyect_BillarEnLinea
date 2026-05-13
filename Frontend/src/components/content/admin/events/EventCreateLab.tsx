"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { parseTagsInput } from "@/components/content/admin/shared";
import { ADMIN_INPUT as inputClass } from "@/components/ui/styles";
import {
  EVENT_REGISTRATION_MODES,
  EVENT_STATUSES,
  EVENT_TICKETING_MODES,
  EVENT_TIERS,
  EVENT_TYPES,
  createEventAdmin,
  uploadEventImage,
  type CreateAdminEventInput,
  type EventRegistrationMode,
  type EventStatus,
  type EventTicketingMode,
  type EventTier,
  type EventType,
} from "@/lib/api/admin-events";

type FormState = { kind: "idle" | "success" | "error"; message?: string };
type FieldErrors = Partial<Record<string, string>>;

const initialState: FormState = { kind: "idle" };

function toIsoFromLocal(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function EventCreateLab() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [registrationMode, setRegistrationMode] = useState<EventRegistrationMode>("NONE");
  const [ticketingMode, setTicketingMode] = useState<EventTicketingMode>("NO_TICKETS");
  const [hasGrandstand, setHasGrandstand] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const nameInput = (formRef.current?.elements.namedItem("name") as HTMLInputElement | null)?.value ?? "";
      const result = await uploadEventImage(file, `${nameInput || "evento"}-promo`);
      setImageUrl(result.data.url);
      setState({ kind: "idle" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo subir la imagen.";
      setState({ kind: "error", message });
    } finally {
      setImageUploading(false);
      if (event.target) event.target.value = "";
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const errors: FieldErrors = {};

    const name = String(formData.get("name") ?? "").trim();
    const type = String(formData.get("type") ?? "") as EventType;
    const tier = String(formData.get("tier") ?? "") as EventTier;
    const status = String(formData.get("status") ?? "SCHEDULED") as EventStatus;
    const startDate = toIsoFromLocal(String(formData.get("startDate") ?? ""));
    const endDate = toIsoFromLocal(String(formData.get("endDate") ?? ""));
    const description = String(formData.get("description") ?? "").trim();
    const organizer = String(formData.get("organizer") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const department = String(formData.get("department") ?? "").trim();
    const country = String(formData.get("country") ?? "").trim();
    const entryFeeRaw = String(formData.get("entryFee") ?? "").trim();
    const ticketPriceRaw = String(formData.get("ticketPrice") ?? "").trim();
    const registrationUrl = String(formData.get("registrationUrl") ?? "").trim();
    const ticketUrl = String(formData.get("ticketUrl") ?? "").trim();
    const streamUrl = String(formData.get("streamUrl") ?? "").trim();
    const resultsUrl = String(formData.get("resultsUrl") ?? "").trim();
    const grandstandDetails = String(formData.get("grandstandDetails") ?? "").trim();
    const seoTitle = String(formData.get("seoTitle") ?? "").trim();
    const seoDescription = String(formData.get("seoDescription") ?? "").trim();
    const tags = parseTagsInput(String(formData.get("tags") ?? ""));
    const featured = formData.get("featured") === "on";

    if (!name) errors.name = "El nombre es obligatorio.";
    if (!type) errors.type = "Selecciona un tipo de evento.";
    if (!tier) errors.tier = "Selecciona el alcance del evento.";
    if (!startDate) errors.startDate = "La fecha de inicio es obligatoria.";

    const entryFee = entryFeeRaw === "" ? undefined : Number(entryFeeRaw);
    if (entryFee !== undefined && (!Number.isFinite(entryFee) || entryFee < 0)) {
      errors.entryFee = "El valor de inscripción debe ser 0 o mayor.";
    }
    const ticketPrice = ticketPriceRaw === "" ? undefined : Number(ticketPriceRaw);
    if (ticketPrice !== undefined && (!Number.isFinite(ticketPrice) || ticketPrice < 0)) {
      errors.ticketPrice = "El precio del boleto debe ser 0 o mayor.";
    }

    if (registrationMode === "EXTERNAL_LINK" && !registrationUrl) {
      errors.registrationUrl = "Requerido cuando la inscripción es por enlace externo.";
    }
    if (ticketingMode === "EXTERNAL_LINK" && !ticketUrl) {
      errors.ticketUrl = "Requerido cuando la boletería es por enlace externo.";
    }
    if (ticketingMode === "INTERNAL" && !hasGrandstand) {
      errors.ticketingMode = "Boletería interna requiere marcar 'Tiene tribuna'.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setState({ kind: "error", message: "Revisa los campos marcados antes de continuar." });
      return;
    }

    const payload: CreateAdminEventInput = {
      name,
      type,
      tier,
      status,
      startDate: startDate!,
      registrationMode,
      ticketingMode,
      hasGrandstand,
      featured,
    };
    if (endDate) payload.endDate = endDate;
    if (description) payload.description = description;
    if (organizer) payload.organizer = organizer;
    if (location) payload.location = location;
    if (city) payload.city = city;
    if (department) payload.department = department;
    if (country) payload.country = country;
    if (entryFee !== undefined) payload.entryFee = entryFee;
    if (ticketPrice !== undefined) payload.ticketPrice = ticketPrice;
    if (registrationUrl) payload.registrationUrl = registrationUrl;
    if (ticketUrl) payload.ticketUrl = ticketUrl;
    if (streamUrl) payload.streamUrl = streamUrl;
    if (resultsUrl) payload.resultsUrl = resultsUrl;
    if (grandstandDetails) payload.grandstandDetails = grandstandDetails;
    if (imageUrl) payload.imageUrl = imageUrl;
    if (seoTitle) payload.seoTitle = seoTitle;
    if (seoDescription) payload.seoDescription = seoDescription;
    if (tags) payload.tags = tags;

    startTransition(async () => {
      try {
        const result = await createEventAdmin(payload);
        const slug = result.data?.slug;
        setState({ kind: "success", message: "Evento creado correctamente." });
        if (slug) {
          router.push(`/admin/eventos/${slug}`);
          router.refresh();
        } else {
          router.push("/admin/eventos");
          router.refresh();
        }
      } catch (error) {
        let message = "No se pudo crear el evento.";
        if (error instanceof ApiError) {
          const data = error.payload as { message?: string } | undefined;
          message = data?.message ?? error.message;
        } else if (error instanceof Error) {
          message = error.message;
        }
        setState({ kind: "error", message });
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Laboratorio de creación</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Nuevo evento</h2>
        </div>
        <Link href="/admin/eventos" className="text-sm font-medium text-white/62 transition hover:text-white">
          ← Volver al panel
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Nombre *</span>
          <input
            name="name"
            type="text"
            placeholder="Ej. Copa Nacional Billar 2026"
            className={inputClass}
            required
          />
          {fieldErrors.name ? <span className="text-xs text-rose-300">{fieldErrors.name}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Tipo *</span>
          <select name="type" defaultValue="" className={inputClass} required>
            <option value="" disabled className="bg-[#0b0d12]">
              Selecciona un tipo
            </option>
            {EVENT_TYPES.map((value) => (
              <option key={value} value={value} className="bg-[#0b0d12]">
                {value}
              </option>
            ))}
          </select>
          {fieldErrors.type ? <span className="text-xs text-rose-300">{fieldErrors.type}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Alcance *</span>
          <select name="tier" defaultValue="" className={inputClass} required>
            <option value="" disabled className="bg-[#0b0d12]">
              Selecciona un alcance
            </option>
            {EVENT_TIERS.map((value) => (
              <option key={value} value={value} className="bg-[#0b0d12]">
                {value}
              </option>
            ))}
          </select>
          {fieldErrors.tier ? <span className="text-xs text-rose-300">{fieldErrors.tier}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Estado inicial</span>
          <select name="status" defaultValue="SCHEDULED" className={inputClass}>
            {EVENT_STATUSES.map((value) => (
              <option key={value} value={value} className="bg-[#0b0d12]">
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Destacado</span>
          <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
            <input name="featured" type="checkbox" className="h-4 w-4 accent-[#f6c44f]" />
            <span className="text-sm text-white/78">Mostrar como destacado en home</span>
          </span>
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Inicio *</span>
          <input name="startDate" type="datetime-local" className={inputClass} required />
          {fieldErrors.startDate ? <span className="text-xs text-rose-300">{fieldErrors.startDate}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Cierre</span>
          <input name="endDate" type="datetime-local" className={inputClass} />
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Descripción</span>
          <textarea
            name="description"
            rows={4}
            placeholder="Detalles del evento, formato, modalidad…"
            className={`${inputClass} resize-y`}
          />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Organizador</span>
          <input name="organizer" type="text" placeholder="Ej. Federación Colombiana" className={inputClass} />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Sede / lugar</span>
          <input name="location" type="text" placeholder="Ej. Coliseo El Salitre" className={inputClass} />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Ciudad</span>
          <input name="city" type="text" placeholder="Bogotá" className={inputClass} />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Departamento</span>
          <input name="department" type="text" placeholder="Cundinamarca" className={inputClass} />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">País</span>
          <input name="country" type="text" defaultValue="Colombia" className={inputClass} />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Valor inscripción (COP)</span>
          <input name="entryFee" type="number" min={0} step={1000} defaultValue={0} className={inputClass} />
          {fieldErrors.entryFee ? <span className="text-xs text-rose-300">{fieldErrors.entryFee}</span> : null}
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Modo de inscripción</span>
          <select
            name="registrationMode"
            value={registrationMode}
            onChange={(e) => setRegistrationMode(e.target.value as EventRegistrationMode)}
            className={inputClass}
          >
            {EVENT_REGISTRATION_MODES.map((value) => (
              <option key={value} value={value} className="bg-[#0b0d12]">
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">URL de inscripción</span>
          <input
            name="registrationUrl"
            type="url"
            placeholder="https://…"
            className={inputClass}
            disabled={registrationMode !== "EXTERNAL_LINK"}
          />
          {fieldErrors.registrationUrl ? <span className="text-xs text-rose-300">{fieldErrors.registrationUrl}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Modo de boletería</span>
          <select
            name="ticketingMode"
            value={ticketingMode}
            onChange={(e) => setTicketingMode(e.target.value as EventTicketingMode)}
            className={inputClass}
          >
            {EVENT_TICKETING_MODES.map((value) => (
              <option key={value} value={value} className="bg-[#0b0d12]">
                {value}
              </option>
            ))}
          </select>
          {fieldErrors.ticketingMode ? <span className="text-xs text-rose-300">{fieldErrors.ticketingMode}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Precio del boleto (COP)</span>
          <input
            name="ticketPrice"
            type="number"
            min={0}
            step={1000}
            className={inputClass}
            disabled={ticketingMode === "NO_TICKETS"}
          />
          {fieldErrors.ticketPrice ? <span className="text-xs text-rose-300">{fieldErrors.ticketPrice}</span> : null}
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">URL externa de boletería</span>
          <input
            name="ticketUrl"
            type="url"
            placeholder="https://…"
            className={inputClass}
            disabled={ticketingMode !== "EXTERNAL_LINK"}
          />
          {fieldErrors.ticketUrl ? <span className="text-xs text-rose-300">{fieldErrors.ticketUrl}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Tribuna</span>
          <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
            <input
              type="checkbox"
              checked={hasGrandstand}
              onChange={(e) => setHasGrandstand(e.target.checked)}
              className="h-4 w-4 accent-[#f6c44f]"
            />
            <span className="text-sm text-white/78">El evento cuenta con tribuna</span>
          </span>
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Detalles tribuna</span>
          <input
            name="grandstandDetails"
            type="text"
            placeholder="Capacidad, ubicación…"
            className={inputClass}
            disabled={!hasGrandstand}
          />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">URL de transmisión</span>
          <input name="streamUrl" type="url" placeholder="https://…" className={inputClass} />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">URL de resultados</span>
          <input name="resultsUrl" type="url" placeholder="https://…" className={inputClass} />
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">SEO – Título</span>
          <input
            name="seoTitle"
            type="text"
            placeholder="Título que aparecerá en buscadores y redes sociales"
            className={inputClass}
            maxLength={120}
          />
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">SEO – Descripción</span>
          <textarea
            name="seoDescription"
            rows={3}
            placeholder="Resumen breve para SEO (máximo ≈160 caracteres)"
            className={`${inputClass} resize-y`}
            maxLength={300}
          />
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Etiquetas</span>
          <input
            name="tags"
            type="text"
            placeholder="ranking, élite, exhibición (separadas por coma)"
            className={inputClass}
          />
          <span className="text-[0.7rem] text-white/45">
            Sirven para filtrar/agrupar eventos. Separa cada etiqueta con una coma.
          </span>
        </label>
      </section>

      <section className="grid gap-2">
        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Imagen promocional</span>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(246,196,79,0.18)] file:px-4 file:py-2 file:text-[#f6c44f] hover:file:bg-[rgba(246,196,79,0.28)]"
        />
        {imageUploading ? <span className="text-xs text-white/55">Subiendo imagen…</span> : null}
        {imageUrl ? (
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Imagen promocional" className="h-40 w-full object-cover" />
          </div>
        ) : null}
      </section>

      {state.kind === "error" ? (
        <p className="rounded-2xl border border-rose-300/24 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {state.message}
        </p>
      ) : null}
      {state.kind === "success" ? (
        <p className="rounded-2xl border border-emerald-300/24 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          href="/admin/eventos"
          className="rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/78 transition hover:bg-white/10"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending || imageUploading}
          className="rounded-full bg-[linear-gradient(135deg,#f6c44f,#e0a936)] px-6 py-2.5 text-sm font-semibold text-[#1c160a] shadow-[0_8px_24px_rgba(246,196,79,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creando…" : "Crear evento"}
        </button>
      </div>
    </form>
  );
}
