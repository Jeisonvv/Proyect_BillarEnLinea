"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { parseTagsInput, toIsoDate } from "@/components/content/admin/shared";
import { ADMIN_INPUT as inputClass } from "@/components/ui/styles";
import {
  ACTIVITY_STATUSES,
  createActivityAdmin,
  uploadActivityImage,
  type CreateActivityInput,
  type ActivityStatus,
} from "@/lib/api/admin-activities";

type FormState = {
  kind: "idle" | "success" | "error";
  message?: string;
  activityId?: string;
};

type FieldErrors = Partial<Record<string, string>>;

const initialState: FormState = { kind: "idle" };

function isPowerOfTen(value: number) {
  if (!Number.isInteger(value) || value < 10) return false;
  let n = value;
  while (n > 1) {
    if (n % 10 !== 0) return false;
    n = n / 10;
  }
  return n === 1;
}

export function ActivityCreateLab() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prizeImageUploading, setPrizeImageUploading] = useState(false);
  const [prizeImageUrl, setPrizeImageUrl] = useState<string>("");
  const [prizeImageFile, setPrizeImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const prizeImageInputRef = useRef<HTMLInputElement>(null);
  const imagePreviewUrlRef = useRef<string | null>(null);
  const prizeImagePreviewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
      if (prizeImagePreviewUrlRef.current) URL.revokeObjectURL(prizeImagePreviewUrlRef.current);
    };
  }, []);

  async function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
    target: "image" | "prizeImage",
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    if (target === "image") {
      if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
      imagePreviewUrlRef.current = previewUrl;
      setImageFile(file);
      setImageUrl(previewUrl);
    } else {
      if (prizeImagePreviewUrlRef.current) URL.revokeObjectURL(prizeImagePreviewUrlRef.current);
      prizeImagePreviewUrlRef.current = previewUrl;
      setPrizeImageFile(file);
      setPrizeImageUrl(previewUrl);
    }
    setState({ kind: "idle" });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const errors: FieldErrors = {};
    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const seoTitle = String(formData.get("seoTitle") ?? "").trim();
    const seoDescription = String(formData.get("seoDescription") ?? "").trim();
    const tags = parseTagsInput(String(formData.get("tags") ?? ""));
    const prize = String(formData.get("prize") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const status = String(formData.get("status") ?? "DRAFT") as ActivityStatus;
    const ticketPriceRaw = String(formData.get("ticketPrice") ?? "").trim();
    const totalTicketsRaw = String(formData.get("totalTickets") ?? "").trim();
    const drawDateRaw = String(formData.get("drawDate") ?? "").trim();
    const promoVideoUrl = String(formData.get("promoVideoUrl") ?? "").trim();

    if (!name) errors.name = "El nombre es obligatorio.";
    if (!prize) errors.prize = "El premio es obligatorio.";

    const ticketPrice = Number(ticketPriceRaw);
    if (!Number.isFinite(ticketPrice) || ticketPrice < 0) {
      errors.ticketPrice = "El precio debe ser 0 o mayor.";
    }

    const totalTickets = Number(totalTicketsRaw);
    if (!Number.isInteger(totalTickets) || !isPowerOfTen(totalTickets)) {
      errors.totalTickets = "Debe ser una potencia de 10 (10, 100, 1000…).";
    }

    const drawDate = toIsoDate(drawDateRaw);
    if (!drawDate) {
      errors.drawDate = "La fecha del sorteo es obligatoria.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setState({ kind: "error", message: "Revisa los campos marcados antes de continuar." });
      return;
    }

    startTransition(async () => {
      try {
        let uploadedImageUrl = "";
        let uploadedPrizeImageUrl = "";
        const selectedImageFile = imageFile ?? imageInputRef.current?.files?.[0] ?? null;
        const selectedPrizeImageFile = prizeImageFile ?? prizeImageInputRef.current?.files?.[0] ?? null;

        if (selectedImageFile) {
          setImageUploading(true);
          const result = await uploadActivityImage(selectedImageFile, `${name || "rifa"}-promo`);
          uploadedImageUrl = result.data.url;
          setImageUrl(uploadedImageUrl);
          setImageFile(null);
          if (imagePreviewUrlRef.current) {
            URL.revokeObjectURL(imagePreviewUrlRef.current);
            imagePreviewUrlRef.current = null;
          }
          setImageUploading(false);
        }

        if (selectedPrizeImageFile) {
          setPrizeImageUploading(true);
          const result = await uploadActivityImage(selectedPrizeImageFile, `${name || "rifa"}-premio`);
          uploadedPrizeImageUrl = result.data.url;
          setPrizeImageUrl(uploadedPrizeImageUrl);
          setPrizeImageFile(null);
          if (prizeImagePreviewUrlRef.current) {
            URL.revokeObjectURL(prizeImagePreviewUrlRef.current);
            prizeImagePreviewUrlRef.current = null;
          }
          setPrizeImageUploading(false);
        }

        const payload: CreateActivityInput = {
          name,
          prize,
          ticketPrice,
          totalTickets,
          drawDate: drawDate!,
          status,
          promoVideoUrl,
        };

        if (description) payload.description = description;
        if (slug) payload.slug = slug;
        if (seoTitle) payload.seoTitle = seoTitle;
        if (seoDescription) payload.seoDescription = seoDescription;
        if (tags) payload.tags = tags;
        if (uploadedImageUrl) payload.imageUrl = uploadedImageUrl;
        if (uploadedPrizeImageUrl) payload.prizeImageUrl = uploadedPrizeImageUrl;

        const result = await createActivityAdmin(payload);
        const id = result.data?._id;
        const createdSlug = result.data?.slug;
        setState({
          kind: "success",
          message: "Actividad creada correctamente.",
          activityId: id,
        });
        const target = createdSlug ?? id;
        if (target) {
          router.push(`/admin/activities/${target}`);
          router.refresh();
        }
      } catch (error) {
        setImageUploading(false);
        setPrizeImageUploading(false);
        let message = "No se pudo crear la actividad.";
        if (error instanceof ApiError) {
          const payload = error.payload as { message?: string } | undefined;
          message = payload?.message ?? error.message;
        } else if (error instanceof Error) {
          message = error.message;
        }
        setState({ kind: "error", message });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Laboratorio de creación</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Nueva actividad</h2>
        </div>
        <Link href="/admin/activities" className="text-sm font-medium text-white/62 transition hover:text-white">
          ← Volver al panel
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Nombre *</span>
          <input
            name="name"
            type="text"
            placeholder="Ej. Actividad fin de año Billar en Línea"
            className={inputClass}
            required
          />
          {fieldErrors.name ? <span className="text-xs text-rose-300">{fieldErrors.name}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Estado inicial</span>
          <select name="status" defaultValue="DRAFT" className={inputClass}>
            {ACTIVITY_STATUSES.filter((s) => s !== "DRAWN").map((s) => (
              <option key={s} value={s} className="bg-[#0b0d12]">
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Premio *</span>
          <input
            name="prize"
            type="text"
            placeholder="Ej. Taco profesional Predator P3"
            className={inputClass}
            required
          />
          {fieldErrors.prize ? <span className="text-xs text-rose-300">{fieldErrors.prize}</span> : null}
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Descripción</span>
          <textarea
            name="description"
            rows={4}
            placeholder="Detalles del premio, condiciones, dinámica…"
            className={`${inputClass} resize-y`}
          />
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
            placeholder="navidad, premium, gratis (separadas por coma)"
            className={inputClass}
          />
          <span className="text-[0.7rem] text-white/45">
            Sirven para filtrar/agrupar actividades en la web. Separa cada etiqueta con una coma.
          </span>
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Precio del boleto (COP) *</span>
          <input
            name="ticketPrice"
            type="number"
            min={0}
            step={1000}
            defaultValue={10000}
            className={inputClass}
            required
          />
          <span className="text-[0.7rem] text-white/45">Usa 0 para una actividad gratuita.</span>
          {fieldErrors.ticketPrice ? <span className="text-xs text-rose-300">{fieldErrors.ticketPrice}</span> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Total de boletos *</span>
          <input
            name="totalTickets"
            type="number"
            min={10}
            step={10}
            defaultValue={100}
            className={inputClass}
            required
          />
          <span className="text-[0.7rem] text-white/45">Debe ser potencia de 10 (10, 100, 1000…). No se puede modificar luego.</span>
          {fieldErrors.totalTickets ? <span className="text-xs text-rose-300">{fieldErrors.totalTickets}</span> : null}
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Fecha del sorteo *</span>
          <input name="drawDate" type="datetime-local" className={inputClass} required />
          {fieldErrors.drawDate ? <span className="text-xs text-rose-300">{fieldErrors.drawDate}</span> : null}
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Imagen promocional</span>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e, "image")}
            className="text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(246,196,79,0.18)] file:px-4 file:py-2 file:text-[#f6c44f] hover:file:bg-[rgba(246,196,79,0.28)]"
          />
          <span className="text-[0.7rem] text-white/45">La imagen se sube al crear la actividad.</span>
          {imageUploading ? <span className="text-xs text-white/55">Subiendo imagen…</span> : null}
          {imageUrl ? (
            <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Imagen promocional" className="h-40 w-full object-cover" />
            </div>
          ) : null}
        </div>

        <div className="grid gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Foto del premio</span>
          <input
            ref={prizeImageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e, "prizeImage")}
            className="text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(246,196,79,0.18)] file:px-4 file:py-2 file:text-[#f6c44f] hover:file:bg-[rgba(246,196,79,0.28)]"
          />
          <span className="text-[0.7rem] text-white/45">La imagen se sube al crear la actividad.</span>
          {prizeImageUploading ? <span className="text-xs text-white/55">Subiendo foto…</span> : null}
          {prizeImageUrl ? (
            <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={prizeImageUrl} alt="Foto del premio" className="h-40 w-full object-cover" />
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 md:col-span-2">
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Video promocional (URL)</span>
          <input
            name="promoVideoUrl"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            className={inputClass}
          />
          <span className="text-[0.7rem] text-white/45">Opcional. Puedes poner un video de YouTube, Vimeo o enlace directo a MP4.</span>
        </label>
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
          href="/admin/activities"
          className="rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/78 transition hover:bg-white/10"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending || imageUploading || prizeImageUploading}
          className="rounded-full bg-[linear-gradient(135deg,#f6c44f,#e0a936)] px-6 py-2.5 text-sm font-semibold text-[#1c160a] shadow-[0_8px_24px_rgba(246,196,79,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creando…" : "Crear actividad"}
        </button>
      </div>
    </form>
  );
}
