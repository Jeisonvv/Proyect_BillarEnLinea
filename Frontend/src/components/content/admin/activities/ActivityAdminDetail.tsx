"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import {
  AdminDeleteItemButton,
  formatAdminDate,
  formatAdminMoney,
  humanizeAdminToken,
} from "@/components/content/admin/shared";
import { ApiError } from "@/lib/api/client";
import { parseTagsInput, toDateTimeLocalValue, toIsoDate as toIsoFromLocal } from "@/components/content/admin/shared";
import { ADMIN_INPUT as inputClass } from "@/components/ui/styles";
import {
  ACTIVITY_NUMBER_STATUSES,
  ACTIVITY_STATUSES,
  drawActivityAdmin,
  getActivityNumberOwnersAdmin,
  updateActivityAdmin,
  uploadActivityImage,
  type ActivityAdminDetailDto,
  type ActivityNumberOwner,
  type ActivityNumberStatus,
  type ActivityStatus,
  type UpdateActivityInput,
} from "@/lib/api/admin-activities";

type FeedbackState = { kind: "idle" | "success" | "error"; message?: string };

const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  CLOSED: "Cerrada",
  DRAWN: "Sorteada",
};

const NUMBER_STATUS_LABELS: Record<ActivityNumberStatus, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Reservado",
  PAID: "Pagado",
  WINNER: "Ganador",
};

function areTagsEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function getStatusBadgeClass(status: ActivityStatus | string | null | undefined) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-300/24 bg-emerald-400/12 text-emerald-100";
    case "CLOSED":
      return "border-sky-300/24 bg-sky-400/12 text-sky-100";
    case "DRAWN":
      return "border-violet-300/24 bg-violet-400/12 text-violet-100";
    case "DRAFT":
    default:
      return "border-[rgba(246,196,79,0.18)] bg-[rgba(246,196,79,0.1)] text-[rgba(255,233,174,0.96)]";
  }
}

function getNumberStatusBadgeClass(status: ActivityNumberStatus | string | null | undefined) {
  switch (status) {
    case "PAID":
      return "border-emerald-300/24 bg-emerald-400/12 text-emerald-100";
    case "RESERVED":
      return "border-[rgba(246,196,79,0.18)] bg-[rgba(246,196,79,0.1)] text-[rgba(255,233,174,0.96)]";
    case "WINNER":
      return "border-violet-300/24 bg-violet-400/12 text-violet-100";
    case "AVAILABLE":
    default:
      return "border-white/10 bg-white/6 text-white/70";
  }
}

export type ActivityAdminDetailProps = {
  activity: ActivityAdminDetailDto;
  initialOwners: ActivityNumberOwner[];
  ownersError?: string | null;
};

export function ActivityAdminDetail({ activity: initialActivity, initialOwners, ownersError }: ActivityAdminDetailProps) {
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityAdminDetailDto>(initialActivity);
  const [editFeedback, setEditFeedback] = useState<FeedbackState>({ kind: "idle" });
  const [drawFeedback, setDrawFeedback] = useState<FeedbackState>({ kind: "idle" });
  const [editPending, startEditTransition] = useTransition();
  const [drawPending, startDrawTransition] = useTransition();

  const [imageUrl, setImageUrl] = useState<string>(activity.imageUrl ?? "");
  const [prizeImageUrl, setPrizeImageUrl] = useState<string>(activity.prizeImageUrl ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prizeImageFile, setPrizeImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [prizeImageUploading, setPrizeImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const prizeImageInputRef = useRef<HTMLInputElement>(null);
  const imagePreviewUrlRef = useRef<string | null>(null);
  const prizeImagePreviewUrlRef = useRef<string | null>(null);

  const [ownersFilter, setOwnersFilter] = useState<ActivityNumberStatus | "ALL">("ALL");
  const [owners, setOwners] = useState<ActivityNumberOwner[]>(initialOwners);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [ownersFeedback, setOwnersFeedback] = useState<FeedbackState>(() =>
    ownersError && initialOwners.length === 0
      ? { kind: "error", message: ownersError }
      : { kind: "idle" },
  );

  const isDrawn = activity.status === "DRAWN";
  const totalSold = activity.soldTickets ?? 0;
  const total = activity.totalTickets ?? 0;
  const percent = total > 0 ? Math.min(100, Math.round((totalSold / total) * 100)) : 0;

  useEffect(() => {
    return () => {
      if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
      if (prizeImagePreviewUrlRef.current) URL.revokeObjectURL(prizeImagePreviewUrlRef.current);
    };
  }, []);

  async function refreshOwners(nextFilter: ActivityNumberStatus | "ALL" = ownersFilter) {
    setOwnersLoading(true);
    setOwnersFeedback({ kind: "idle" });
    try {
      const params: { status?: string; limit: number } = { limit: 200 };
      if (nextFilter !== "ALL") params.status = nextFilter;
      const result = await getActivityNumberOwnersAdmin(activity._id, params);
      setOwners(result.data?.numbers ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudieron cargar los números.";
      setOwnersFeedback({ kind: "error", message });
    } finally {
      setOwnersLoading(false);
    }
  }

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
    setEditFeedback({ kind: "idle" });
  }

  function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditFeedback({ kind: "idle" });
    const fd = new FormData(event.currentTarget);

    const name = String(fd.get("name") ?? "").trim();
    const slug = String(fd.get("slug") ?? "").trim();
    const seoTitle = String(fd.get("seoTitle") ?? "").trim();
    const seoDescription = String(fd.get("seoDescription") ?? "").trim();
    const tagsRaw = String(fd.get("tags") ?? "");
    const tags = parseTagsInput(tagsRaw) ?? [];
    const prize = String(fd.get("prize") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const status = String(fd.get("status") ?? activity.status) as ActivityStatus;
    const ticketPriceRaw = String(fd.get("ticketPrice") ?? "").trim();
    const drawDateRaw = String(fd.get("drawDate") ?? "").trim();

    startEditTransition(async () => {
      try {
        let nextImageUrl = activity.imageUrl ?? "";
        let nextPrizeImageUrl = activity.prizeImageUrl ?? "";
        const selectedImageFile = imageFile ?? imageInputRef.current?.files?.[0] ?? null;
        const selectedPrizeImageFile = prizeImageFile ?? prizeImageInputRef.current?.files?.[0] ?? null;

        if (selectedImageFile) {
          setImageUploading(true);
          const result = await uploadActivityImage(selectedImageFile, `${name || activity.name || "rifa"}-promo`);
          nextImageUrl = result.data.url;
          setImageUrl(nextImageUrl);
          setImageFile(null);
          if (imagePreviewUrlRef.current) {
            URL.revokeObjectURL(imagePreviewUrlRef.current);
            imagePreviewUrlRef.current = null;
          }
          setImageUploading(false);
        }

        if (selectedPrizeImageFile) {
          setPrizeImageUploading(true);
          const result = await uploadActivityImage(selectedPrizeImageFile, `${name || activity.name || "rifa"}-premio`);
          nextPrizeImageUrl = result.data.url;
          setPrizeImageUrl(nextPrizeImageUrl);
          setPrizeImageFile(null);
          if (prizeImagePreviewUrlRef.current) {
            URL.revokeObjectURL(prizeImagePreviewUrlRef.current);
            prizeImagePreviewUrlRef.current = null;
          }
          setPrizeImageUploading(false);
        }

        const patch: UpdateActivityInput = {};
        if (name && name !== activity.name) patch.name = name;
        if (slug !== (activity.slug ?? "")) patch.slug = slug;
        if (seoTitle !== (activity.seoTitle ?? "")) patch.seoTitle = seoTitle;
        if (seoDescription !== (activity.seoDescription ?? "")) patch.seoDescription = seoDescription;
        if (!areTagsEqual(tags, activity.tags ?? [])) patch.tags = tags;
        if (prize && prize !== activity.prize) patch.prize = prize;
        if ((description || "") !== (activity.description ?? "")) patch.description = description;
        if (status && status !== activity.status && status !== "DRAWN") patch.status = status;

        if (ticketPriceRaw !== "") {
          const value = Number(ticketPriceRaw);
          if (Number.isFinite(value) && value !== activity.ticketPrice) {
            patch.ticketPrice = value;
          }
        }

        const isoDraw = toIsoFromLocal(drawDateRaw);
        if (isoDraw && isoDraw !== new Date(activity.drawDate).toISOString()) {
          patch.drawDate = isoDraw;
        }

        if (nextImageUrl !== (activity.imageUrl ?? "")) {
          patch.imageUrl = nextImageUrl;
        }
        if (nextPrizeImageUrl !== (activity.prizeImageUrl ?? "")) {
          patch.prizeImageUrl = nextPrizeImageUrl;
        }

        if (Object.keys(patch).length === 0) {
          setEditFeedback({ kind: "success", message: "Sin cambios para guardar." });
          return;
        }

        const result = await updateActivityAdmin(activity._id, patch);
        setActivity(result.data);
        setImageUrl(result.data.imageUrl ?? "");
        setPrizeImageUrl(result.data.prizeImageUrl ?? "");
        setEditFeedback({ kind: "success", message: "Actividad actualizada correctamente." });
        router.refresh();
      } catch (error) {
        setImageUploading(false);
        setPrizeImageUploading(false);
        let message = "No se pudo actualizar la actividad.";
        if (error instanceof ApiError) {
          const payload = error.payload as { message?: string } | undefined;
          message = payload?.message ?? error.message;
        } else if (error instanceof Error) {
          message = error.message;
        }
        setEditFeedback({ kind: "error", message });
      }
    });
  }

  function handleDrawSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDrawFeedback({ kind: "idle" });
    const fd = new FormData(event.currentTarget);
    const winningNumber = String(fd.get("winningNumber") ?? "").trim();
    if (!winningNumber) {
      setDrawFeedback({ kind: "error", message: "Ingresa el número ganador." });
      return;
    }

    if (!confirm(`¿Confirmas el sorteo con el número ganador ${winningNumber}?`)) return;

    startDrawTransition(async () => {
      try {
        const result = await drawActivityAdmin(activity._id, { winningNumber });
        if (result.data) setActivity(result.data);
        setDrawFeedback({
          kind: "success",
          message: result.message ?? (result.hasWinner ? "Sorteo completado." : "Sorteo registrado sin ganador."),
        });
        router.refresh();
      } catch (error) {
        let message = "No se pudo ejecutar el sorteo.";
        if (error instanceof ApiError) {
          const payload = error.payload as { message?: string } | undefined;
          message = payload?.message ?? error.message;
        } else if (error instanceof Error) {
          message = error.message;
        }
        setDrawFeedback({ kind: "error", message });
      }
    });
  }

  return (
    <div className="grid gap-6">
      {/* Resumen */}
      <section className="overflow-hidden rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5">
        <div className="grid gap-5 lg:grid-cols-[12rem_minmax(0,1fr)] lg:items-start">
          <div className="relative aspect-4/5 min-h-48 overflow-hidden rounded-[1.4rem] border border-white/10 bg-[linear-gradient(135deg,rgba(246,196,79,0.16),rgba(13,110,174,0.16),rgba(255,255,255,0.04))]">
            {activity.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activity.imageUrl} alt={activity.name} className="h-full w-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,14,0.08),rgba(8,10,14,0.18),rgba(8,10,14,0.88))]" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-[0.65rem] uppercase tracking-[0.24em] text-white/54">Imagen promocional</p>
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-white">{activity.name}</h2>
                <p className="mt-1 text-sm leading-7 text-white/64">Premio: {activity.prize}</p>
                <p className="text-sm leading-7 text-white/64">Sorteo: {formatAdminDate(activity.drawDate)}</p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] ${getStatusBadgeClass(
                  activity.status,
                )}`}
              >
                {ACTIVITY_STATUS_LABELS[activity.status as ActivityStatus] ?? humanizeAdminToken(activity.status)}
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Boleto</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {activity.ticketPrice === 0 ? "Gratis" : formatAdminMoney(activity.ticketPrice)}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Vendidos</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {totalSold} / {total}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full bg-[linear-gradient(90deg,rgba(246,196,79,0.9),rgba(49,121,182,0.9))]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/46">Ganador</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {activity.hasWinner
                    ? `${activity.winnerTicket ?? "—"} · ${activity.winner?.name ?? "Sin asignar"}`
                    : "Aún no se ha sorteado"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/admin/activities"
                className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-white/78 transition hover:bg-white/10"
              >
                ← Volver
              </Link>
              <Link
                href={`/home/activities/${activity.slug ?? activity._id}`}
                className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-white/78 transition hover:bg-white/10"
              >
                Ver vista pública
              </Link>
              <AdminDeleteItemButton
                deletePath={`/api/activities/${activity._id}`}
                itemLabel="actividad"
                itemName={activity.name}
                consequences={[
                  "Se eliminarán los números, boletos y reservas vinculadas a esta actividad.",
                  "También se borrarán las transacciones de pago asociadas.",
                  "Las imágenes en Cloudinary quedarán removidas.",
                ]}
                description={
                  <>
                    Vas a eliminar <span className="font-semibold text-white">{activity.name}</span>. Esta acción es permanente.
                  </>
                }
                successMessage="Actividad eliminada correctamente."
                variant="text"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Edición */}
      <section className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Editar actividad</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Datos generales</h3>
          </div>
        </header>
        <form onSubmit={handleEditSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Nombre</span>
              <input name="name" type="text" defaultValue={activity.name} className={inputClass} disabled={isDrawn} />
            </label>
            <label className="grid gap-2">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Estado</span>
              <select name="status" defaultValue={activity.status} className={inputClass} disabled={isDrawn}>
                {ACTIVITY_STATUSES.map((s) => (
                  <option key={s} value={s} disabled={s === "DRAWN" && activity.status !== "DRAWN"} className="bg-[#0b0d12]">
                    {ACTIVITY_STATUS_LABELS[s] ?? s}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Premio</span>
              <input name="prize" type="text" defaultValue={activity.prize} className={inputClass} disabled={isDrawn} />
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Descripción</span>
              <textarea
                name="description"
                rows={4}
                defaultValue={activity.description ?? ""}
                className={`${inputClass} resize-y`}
                disabled={isDrawn}
              />
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Slug (URL amigable)</span>
              <input
                name="slug"
                type="text"
                defaultValue={activity.slug ?? ""}
                placeholder="se generará desde el nombre si lo dejas vacío"
                className={inputClass}
                disabled={isDrawn}
              />
              <span className="text-[0.7rem] text-white/45">
                Se usa en la URL pública. Si ya existe, se le agregará un sufijo (-2, -3…).
              </span>
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">SEO – Título</span>
              <input
                name="seoTitle"
                type="text"
                defaultValue={activity.seoTitle ?? ""}
                placeholder="Título para buscadores y redes"
                maxLength={120}
                className={inputClass}
                disabled={isDrawn}
              />
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">SEO – Descripción</span>
              <textarea
                name="seoDescription"
                rows={3}
                defaultValue={activity.seoDescription ?? ""}
                placeholder="Resumen breve para SEO (≈160 caracteres)"
                maxLength={300}
                className={`${inputClass} resize-y`}
                disabled={isDrawn}
              />
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Etiquetas</span>
              <input
                name="tags"
                type="text"
                defaultValue={(activity.tags ?? []).join(", ")}
                placeholder="navidad, premium, gratis (separadas por coma)"
                className={inputClass}
                disabled={isDrawn}
              />
              <span className="text-[0.7rem] text-white/45">
                Separa cada etiqueta con coma. Déjalo vacío para quitar todas.
              </span>
            </label>
            <label className="grid gap-2">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Precio del boleto (COP)</span>
              <input
                name="ticketPrice"
                type="number"
                min={0}
                step={1000}
                defaultValue={activity.ticketPrice}
                className={inputClass}
                disabled={isDrawn || totalSold > 0}
              />
              {totalSold > 0 ? (
                <span className="text-[0.7rem] text-white/45">No editable: ya hay boletos vendidos.</span>
              ) : null}
            </label>
            <label className="grid gap-2">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Fecha del sorteo</span>
              <input
                name="drawDate"
                type="datetime-local"
                defaultValue={toDateTimeLocalValue(activity.drawDate)}
                className={inputClass}
                disabled={isDrawn}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Imagen promocional</span>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, "image")}
                disabled={isDrawn}
                className="text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(246,196,79,0.18)] file:px-4 file:py-2 file:text-[#f6c44f] hover:file:bg-[rgba(246,196,79,0.28)]"
              />
              <span className="text-[0.7rem] text-white/45">La imagen se sube al guardar cambios.</span>
              {imageUploading ? <span className="text-xs text-white/55">Subiendo imagen…</span> : null}
              {imageUrl ? (
                <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="Imagen promocional" className="h-32 w-full object-cover" />
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
                disabled={isDrawn}
                className="text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(246,196,79,0.18)] file:px-4 file:py-2 file:text-[#f6c44f] hover:file:bg-[rgba(246,196,79,0.28)]"
              />
              <span className="text-[0.7rem] text-white/45">La imagen se sube al guardar cambios.</span>
              {prizeImageUploading ? <span className="text-xs text-white/55">Subiendo foto…</span> : null}
              {prizeImageUrl ? (
                <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={prizeImageUrl} alt="Foto del premio" className="h-32 w-full object-cover" />
                </div>
              ) : null}
            </div>
          </div>

          {editFeedback.kind === "error" ? (
            <p className="rounded-2xl border border-rose-300/24 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {editFeedback.message}
            </p>
          ) : null}
          {editFeedback.kind === "success" ? (
            <p className="rounded-2xl border border-emerald-300/24 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {editFeedback.message}
            </p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={editPending || imageUploading || prizeImageUploading || isDrawn}
              className="rounded-full bg-[linear-gradient(135deg,#f6c44f,#e0a936)] px-6 py-2.5 text-sm font-semibold text-[#1c160a] shadow-[0_8px_24px_rgba(246,196,79,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editPending ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </section>

      {/* Sorteo */}
      <section className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Sorteo</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Ejecutar el sorteo</h3>
            <p className="mt-1 text-sm text-white/64">
              Ingresa el número ganador. Si fue vendido, ese boleto será el ganador y la actividad pasará a estado <strong>DRAWN</strong>.
            </p>
          </div>
        </header>
        {isDrawn ? (
          <p className="rounded-2xl border border-violet-300/24 bg-violet-400/10 px-4 py-3 text-sm text-violet-100">
            La actividad ya fue sorteada{activity.winnerTicket ? ` con el número ${activity.winnerTicket}` : ""}.
          </p>
        ) : (
          <form onSubmit={handleDrawSubmit} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label className="grid gap-2">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-white/56">Número ganador</span>
              <input
                name="winningNumber"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Ej. 042"
                className={inputClass}
                required
              />
            </label>
            <button
              type="submit"
              disabled={drawPending}
              className="rounded-full bg-[linear-gradient(135deg,#f6c44f,#e0a936)] px-6 py-3 text-sm font-semibold text-[#1c160a] shadow-[0_8px_24px_rgba(246,196,79,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {drawPending ? "Sorteando…" : "Ejecutar sorteo"}
            </button>
            {drawFeedback.kind === "error" ? (
              <p className="rounded-2xl border border-rose-300/24 bg-rose-400/10 px-4 py-3 text-sm text-rose-100 md:col-span-2">
                {drawFeedback.message}
              </p>
            ) : null}
            {drawFeedback.kind === "success" ? (
              <p className="rounded-2xl border border-emerald-300/24 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 md:col-span-2">
                {drawFeedback.message}
              </p>
            ) : null}
          </form>
        )}
      </section>

      {/* Listado de números */}
      <section className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Boletos</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Números y compradores</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={ownersFilter}
              onChange={(e) => {
                const next = e.target.value as ActivityNumberStatus | "ALL";
                setOwnersFilter(next);
                refreshOwners(next);
              }}
              className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/82"
            >
              <option value="ALL" className="bg-[#0b0d12]">Todos</option>
              {ACTIVITY_NUMBER_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-[#0b0d12]">
                  {NUMBER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => refreshOwners()}
              disabled={ownersLoading}
              className="rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs font-medium text-white/82 transition hover:bg-white/10 disabled:opacity-60"
            >
              {ownersLoading ? "Actualizando…" : "Actualizar"}
            </button>
          </div>
        </header>

        {ownersFeedback.kind === "error" ? (
          <p className="mb-3 rounded-2xl border border-rose-300/24 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {ownersFeedback.message}
          </p>
        ) : null}

        {owners.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-black/12 px-4 py-3 text-sm text-white/62">
            {ownersLoading ? "Cargando…" : "No hay boletos vendidos o reservados con este filtro."}
          </p>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-190 table-auto text-sm">
              <thead className="text-left text-[0.7rem] uppercase tracking-[0.18em] text-white/52">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2">Número</th>
                  <th className="whitespace-nowrap px-3 py-2">Estado</th>
                  <th className="whitespace-nowrap px-3 py-2">Comprador</th>
                  <th className="whitespace-nowrap px-3 py-2">Contacto</th>
                  <th className="whitespace-nowrap px-3 py-2">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {owners.map((owner) => (
                  <tr key={owner._id ?? owner.number} className="text-white/82">
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-white">{owner.number}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] ${getNumberStatusBadgeClass(
                          owner.status,
                        )}`}
                      >
                        {NUMBER_STATUS_LABELS[owner.status as ActivityNumberStatus] ?? owner.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {owner.user?.name ?? owner.participantName ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {owner.user?.phone ?? owner.participantPhone ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-white/64">
                      {owner.paidAt
                        ? formatAdminDate(owner.paidAt)
                        : owner.reservedAt
                          ? formatAdminDate(owner.reservedAt)
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
