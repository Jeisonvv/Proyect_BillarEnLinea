"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ApiError } from "@/lib/api/client";
import {
  PLAYER_CATEGORIES,
  TOURNAMENT_FORMATS,
  TOURNAMENT_STATUSES,
  createTournamentAdmin,
  uploadTournamentImage,
  type CreateTournamentInput,
  type PlayerCategory,
  type TournamentFormat,
  type TournamentStatus,
} from "@/lib/api/admin-tournaments";

type FormState = {
  kind: "idle" | "success" | "error";
  message?: string;
  tournamentId?: string;
  tournamentSlug?: string;
  uploadedImageUrl?: string;
};

type FieldErrors = Partial<Record<string, string>>;

type DraftSummary = {
  name: string;
  format: string;
  status: string;
  startDate: string;
  registrationDeadline: string;
  maxParticipants: string;
  entryFee: string;
  venueName: string;
  city: string;
  categoriesCount: number;
  groupSlotsCount: number;
  seoTitle: string;
};

const initialState: FormState = { kind: "idle" };
const initialDraftSummary: DraftSummary = {
  name: "",
  format: "GROUPS_AND_ELIMINATION",
  status: "OPEN",
  startDate: "",
  registrationDeadline: "",
  maxParticipants: "16",
  entryFee: "50000",
  venueName: "",
  city: "",
  categoriesCount: 0,
  groupSlotsCount: 0,
  seoTitle: "",
};

const FORM_STEPS = [
  {
    id: 0,
    kicker: "Paso 1",
    title: "General",
    description: "Nombre, formato, estado y narrativa base del torneo.",
  },
  {
    id: 1,
    kicker: "Paso 2",
    title: "Agenda y cupos",
    description: "Fechas, costo, capacidad total, mesas y horarios de grupos.",
  },
  {
    id: 2,
    kicker: "Paso 3",
    title: "Sede y publicacion",
    description: "Lugar, contacto, streaming, imagen y visibilidad inicial.",
  },
  {
    id: 3,
    kicker: "Paso 4",
    title: "Premios y reglas",
    description: "Categorias permitidas, premios y ajustes competitivos.",
  },
  {
    id: 4,
    kicker: "Paso 5",
    title: "Resumen",
    description: "Revision final antes de crear el torneo.",
  },
] as const;

function toIsoDate(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function toOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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

function parseTagsInput(value: string) {
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return tags.length > 0 ? tags : undefined;
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
        throw new Error(`El horario ${index + 1} debe usar el formato fecha,horaInicio,horaFin opcional,etiqueta opcional.`);
      }

      const date = toIsoDate(`${dateValue}T00:00`);
      if (!date) {
        throw new Error(`La fecha del horario ${index + 1} no es válida.`);
      }

      const looksLikeTime = typeof thirdPart === "string" && /^\d{2}:\d{2}$/.test(thirdPart);
      const endTime = looksLikeTime ? thirdPart : undefined;
      const normalizedLabelParts = [
        ...(looksLikeTime ? labelParts : thirdPart ? [thirdPart, ...labelParts] : labelParts),
      ];

      return {
        date,
        startTime,
        ...(endTime ? { endTime } : {}),
        ...(normalizedLabelParts.join(", ") ? { label: normalizedLabelParts.join(", ") } : {}),
      };
    });

  return slots.length > 0 ? slots : undefined;
}

function isPlayerCategory(value: string): value is PlayerCategory {
  return PLAYER_CATEGORIES.includes(value as PlayerCategory);
}

function getValidationMessage(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  if (element.validity.valueMissing) {
    return "Falta diligenciar este campo.";
  }

  if (element.validity.badInput || element.validity.typeMismatch) {
    return "El valor ingresado no tiene un formato valido.";
  }

  if (element.validity.rangeUnderflow || element.validity.rangeOverflow) {
    return "El valor ingresado está fuera del rango permitido.";
  }

  return "Revisa este campo.";
}

function getControlClass(fieldErrors: FieldErrors, name: string, kind: "input" | "select" | "textarea" = "input") {
  const base = kind === "textarea"
    ? "min-h-24 rounded-[1.5rem] border px-4 py-3 text-white outline-none transition"
    : "min-w-0 w-full rounded-2xl border px-4 py-3 text-white outline-none transition";

  return `${base} ${fieldErrors[name]
    ? "border-rose-400 bg-rose-950/30 text-rose-50 shadow-[0_0_0_1px_rgba(251,113,133,0.24)] focus:border-rose-300"
    : kind === "select"
      ? "border-white/10 bg-[#17191d] focus:border-accent"
      : "border-white/10 bg-white/8 focus:border-accent"
  }`;
}

function buildDraftSummary(form: HTMLFormElement): DraftSummary {
  const formData = new FormData(form);
  const groupStageSlotsText = String(formData.get("groupStageSlotsText") ?? "").trim();

  return {
    name: String(formData.get("name") ?? "").trim(),
    format: String(formData.get("format") ?? "GROUPS_AND_ELIMINATION"),
    status: String(formData.get("status") ?? "OPEN"),
    startDate: String(formData.get("startDate") ?? "").trim(),
    registrationDeadline: String(formData.get("registrationDeadline") ?? "").trim(),
    maxParticipants: String(formData.get("maxParticipants") ?? "").trim(),
    entryFee: String(formData.get("entryFee") ?? "").trim(),
    venueName: String(formData.get("venueName") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    categoriesCount: formData.getAll("allowedCategories").length,
    groupSlotsCount: groupStageSlotsText ? groupStageSlotsText.split(/\r?\n/).filter((line) => line.trim().length > 0).length : 0,
    seoTitle: String(formData.get("seoTitle") ?? "").trim(),
  };
}

function getStepControlNames(step: number) {
  switch (step) {
    case 0:
      return ["name", "format", "status", "shortDescription", "description", "formatDetails"];
    case 1:
      return [
        "startDate",
        "endDate",
        "registrationDeadline",
        "discount20Deadline",
        "discount10Deadline",
        "maxParticipants",
        "entryFee",
        "playersPerGroup",
        "groupStageTables",
        "groupStageSlotsText",
      ];
    case 2:
      return [
        "venueName",
        "location",
        "address",
        "city",
        "country",
        "streamUrl",
        "contactPhone",
        "publishedAt",
        "image",
        "isFeatured",
      ];
    case 3:
      return [
        "allowedCategories",
        "firstPrizeDescription",
        "firstPrizeAmount",
        "secondPrizeDescription",
        "secondPrizeAmount",
        "withHandicap",
      ];
    default:
      return [];
  }
}

export function TournamentCreateLab() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  const [draftSummary, setDraftSummary] = useState<DraftSummary>(initialDraftSummary);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setPreviewUrl(null);
      setSelectedFileName("");
      return;
    }

    setSelectedFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));

    if (formRef.current) {
      setDraftSummary(buildDraftSummary(formRef.current));
    }
  }

  function validateStep(step: number, form: HTMLFormElement) {
    const controlNames = getStepControlNames(step);
    const controls = controlNames.flatMap((name) => Array.from(form.querySelectorAll(`[name="${name}"]`)))
      .filter((element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement => (
        element instanceof HTMLInputElement
        || element instanceof HTMLTextAreaElement
        || element instanceof HTMLSelectElement
      ));

    const nextFieldErrors = controls.reduce<FieldErrors>((acc, element) => {
      if (!element.name || element.disabled || element.checkValidity()) {
        return acc;
      }

      acc[element.name] = getValidationMessage(element);
      return acc;
    }, {});

    if (step === 1) {
      try {
        parseGroupStageSlotsInput(String(new FormData(form).get("groupStageSlotsText") ?? ""));
      } catch (error) {
        nextFieldErrors.groupStageSlotsText = error instanceof Error ? error.message : "Revisa los horarios de grupos.";
      }
    }

    setFieldErrors((current) => ({ ...current, ...nextFieldErrors }));
    return Object.keys(nextFieldErrors).length === 0;
  }

  function handleNextStep() {
    const form = formRef.current;

    if (!form) {
      return;
    }

    if (!validateStep(currentStep, form)) {
      setState({
        kind: "error",
        message: "Antes de continuar, corrige los campos del paso actual.",
      });
      return;
    }

    setState(initialState);
    setCurrentStep((current) => Math.min(current + 1, FORM_STEPS.length - 1));
  }

  function handleStepNavigation(targetStep: number) {
    const form = formRef.current;

    if (!form || targetStep === currentStep) {
      return;
    }

    if (targetStep > currentStep && !validateStep(currentStep, form)) {
      setState({
        kind: "error",
        message: "Antes de avanzar, corrige los campos del paso actual.",
      });
      return;
    }

    setState(initialState);
    setCurrentStep(targetStep);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const controls = Array.from(form.elements).filter((element) => (
      element instanceof HTMLInputElement
      || element instanceof HTMLTextAreaElement
      || element instanceof HTMLSelectElement
    ));

    const nextFieldErrors = controls.reduce<FieldErrors>((acc, element) => {
      if (!element.name || element.disabled || element.checkValidity()) {
        return acc;
      }

      acc[element.name] = getValidationMessage(element);
      return acc;
    }, {});

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setState({
        kind: "error",
        message: "Faltan campos por diligenciar. Revisa los marcados en rojo.",
      });
      return;
    }

    setFieldErrors({});
    const formData = new FormData(form);
    const file = formData.get("image") instanceof File && (formData.get("image") as File).size > 0
      ? (formData.get("image") as File)
      : null;

    const allowedCategories = formData
      .getAll("allowedCategories")
      .filter((value): value is string => typeof value === "string")
      .filter(isPlayerCategory);
    const firstPrizeDescription = toOptionalString(formData.get("firstPrizeDescription"));
    const secondPrizeDescription = toOptionalString(formData.get("secondPrizeDescription"));

    const firstPrizeAmount = toOptionalNumber(formData.get("firstPrizeAmount"));
    const secondPrizeAmount = toOptionalNumber(formData.get("secondPrizeAmount"));
    const groupStageSlots = parseGroupStageSlotsInput(String(formData.get("groupStageSlotsText") ?? ""));
    const tags = parseTagsInput(String(formData.get("tags") ?? ""));

    const payloadBase: CreateTournamentInput = {
      name: String(formData.get("name") ?? "").trim(),
      description: toOptionalString(formData.get("description")),
      shortDescription: toOptionalString(formData.get("shortDescription")),
      formatDetails: toOptionalString(formData.get("formatDetails")),
      format: String(formData.get("format") ?? "OPEN") as TournamentFormat,
      status: String(formData.get("status") ?? "OPEN") as TournamentStatus,
      allowedCategories,
      startDate: toIsoDate(String(formData.get("startDate") ?? "")) ?? "",
      endDate: toIsoDate(String(formData.get("endDate") ?? "")),
      registrationDeadline: toIsoDate(String(formData.get("registrationDeadline") ?? "")) ?? "",
      discount20Deadline: toIsoDate(String(formData.get("discount20Deadline") ?? "")),
      discount10Deadline: toIsoDate(String(formData.get("discount10Deadline") ?? "")),
      entryFee: Number(formData.get("entryFee") ?? 0),
      maxParticipants: Number(formData.get("maxParticipants") ?? 2),
      prizes: [
        ...(firstPrizeDescription ? [{ position: 1, description: firstPrizeDescription, ...(firstPrizeAmount !== undefined ? { amount: firstPrizeAmount } : {}) }] : []),
        ...(secondPrizeDescription ? [{ position: 2, description: secondPrizeDescription, ...(secondPrizeAmount !== undefined ? { amount: secondPrizeAmount } : {}) }] : []),
      ],
      venueName: toOptionalString(formData.get("venueName")),
      location: toOptionalString(formData.get("location")),
      address: toOptionalString(formData.get("address")),
      city: toOptionalString(formData.get("city")),
      country: toOptionalString(formData.get("country")) ?? "Colombia",
      streamUrl: toOptionalString(formData.get("streamUrl")),
      contactPhone: toOptionalString(formData.get("contactPhone")),
      seoTitle: toOptionalString(formData.get("seoTitle")),
      seoDescription: toOptionalString(formData.get("seoDescription")),
      tags,
      isFeatured: formData.get("isFeatured") === "on",
      publishedAt: toIsoDate(String(formData.get("publishedAt") ?? "")),
      playersPerGroup: toOptionalNumber(formData.get("playersPerGroup")),
      groupStageTables: toOptionalNumber(formData.get("groupStageTables")),
      groupStageSlots,
      withHandicap: formData.get("withHandicap") === "on",
    };

    startTransition(async () => {
      try {
        let imageUrl: string | undefined;

        if (file) {
          const upload = await uploadTournamentImage(file, payloadBase.name);
          imageUrl = upload.data.url;
        }

        const payload: CreateTournamentInput = {
          ...payloadBase,
          ...(imageUrl ? { imageUrl } : {}),
          ...(payloadBase.prizes && payloadBase.prizes.length > 0 ? {} : { prizes: undefined }),
          ...(payloadBase.allowedCategories && payloadBase.allowedCategories.length > 0 ? {} : { allowedCategories: undefined }),
          ...(payloadBase.format === "GROUPS" || payloadBase.format === "GROUPS_AND_ELIMINATION"
            ? {}
            : { playersPerGroup: undefined, groupStageTables: undefined, groupStageSlots: undefined }),
        };

        const response = await createTournamentAdmin(payload);

        setState({
          kind: "success",
          message: `Torneo creado: ${response.data.name ?? payload.name}.`,
          tournamentId: response.data._id,
          tournamentSlug: response.data.slug,
          uploadedImageUrl: imageUrl,
        });

        form.reset();
        setCurrentStep(0);
        setDraftSummary(initialDraftSummary);
        setFieldErrors({});
        setSelectedFileName("");
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
      } catch (error) {
        setState({
          kind: "error",
          message:
            error instanceof ApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : "No fue posible crear el torneo.",
        });
      }
    });
  }

  function handleFieldUpdate(event: React.FormEvent<HTMLFormElement>) {
    const target = event.target;

    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      return;
    }

    if (!target.name) {
      return;
    }

    setFieldErrors((current) => {
      if (!current[target.name]) {
        return current;
      }

      if (!target.checkValidity()) {
        return {
          ...current,
          [target.name]: getValidationMessage(target),
        };
      }

      const next = { ...current };
      delete next[target.name];
      return next;
    });

    if (formRef.current) {
      setDraftSummary(buildDraftSummary(formRef.current));
    }
  }

  function renderFieldError(name: string) {
    if (!fieldErrors[name]) {
      return null;
    }

    return <span className="text-xs font-medium text-rose-300">{fieldErrors[name]}</span>;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(246,196,79,0.16)] bg-[linear-gradient(145deg,rgba(8,11,16,0.98),rgba(20,24,31,0.94),rgba(10,12,18,0.98))] shadow-[0_32px_100px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,196,79,0.18),transparent_24%),radial-gradient(circle_at_85%_12%,rgba(13,110,174,0.18),transparent_22%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="border-b border-white/8 px-5 py-6 lg:border-b-0 lg:border-r lg:px-8 lg:py-8">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.34em] text-accent">Laboratorio admin</p>
            <h1 className="mt-4 font-display text-4xl leading-none text-white sm:text-5xl">Crear torneo de prueba</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/70 sm:text-base">
              Dividimos el alta en pasos para que la carga operativa sea mas clara. El submit sigue siendo unico y usa el endpoint administrativo real.
            </p>

            <div className="mt-8 rounded-[1.5rem] border border-[rgba(246,196,79,0.18)] bg-[linear-gradient(180deg,rgba(246,196,79,0.08),rgba(255,255,255,0.02))] p-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[rgba(255,235,188,0.82)]">Recorrido</p>
              <div className="mt-4 grid gap-3">
                {FORM_STEPS.map((step, index) => {
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;

                  return (
                    <button
                      key={step.id}
                      className={`rounded-[1.2rem] border px-4 py-3 text-left transition ${isActive
                        ? "border-[rgba(246,196,79,0.28)] bg-[rgba(246,196,79,0.1)]"
                        : isCompleted
                          ? "border-emerald-400/18 bg-emerald-950/18 hover:border-emerald-300/26 hover:bg-emerald-950/24"
                          : "border-white/8 bg-black/16 hover:border-white/16 hover:bg-white/[0.04]"
                      }`}
                      type="button"
                      onClick={() => handleStepNavigation(index)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/46">{step.kicker}</p>
                          <p className="mt-1 text-sm font-semibold text-white">{step.title}</p>
                        </div>
                        <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-semibold ${isActive
                          ? "bg-accent text-[#0c0d11]"
                          : isCompleted
                            ? "bg-emerald-400/18 text-emerald-100"
                            : "bg-white/8 text-white/64"
                        }`}>
                          {isCompleted ? "OK" : index + 1}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/60">{step.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-white/45">Secuencia</p>
                <ol className="mt-4 grid gap-3 text-sm leading-6 text-white/72">
                  <li>1. Completa cada paso sin perder el contexto del torneo.</li>
                  <li>2. Revisa el resumen final y abre SEO solo si lo necesitas.</li>
                  <li>3. El backend sube la imagen y crea el torneo al final.</li>
                </ol>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/18 p-4">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-white/45">Requisitos</p>
                <p className="mt-3 text-sm leading-7 text-white/68">
                  Necesitas sesión ADMIN o STAFF y tener configurado Cloudinary en el backend para que el upload funcione.
                </p>
              </div>

              <Link
                className="inline-flex w-fit rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/8 hover:text-white"
                href="/home"
              >
                Volver al home
              </Link>
            </div>
          </aside>

          <div className="px-5 py-6 lg:px-8 lg:py-8">
            <form ref={formRef} className="grid gap-5" noValidate onChangeCapture={handleFieldUpdate} onInputCapture={handleFieldUpdate} onSubmit={handleSubmit}>
              <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">{FORM_STEPS[currentStep]?.kicker}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{FORM_STEPS[currentStep]?.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-white/68">{FORM_STEPS[currentStep]?.description}</p>
                  </div>
                  <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-black/18 px-4 py-2 text-sm text-white/72">
                    <span>Progreso</span>
                    <span className="font-semibold text-white">{currentStep + 1}/{FORM_STEPS.length}</span>
                  </div>
                </div>
              </div>

              <div className={`${currentStep === 0 ? "grid" : "hidden"} gap-5`}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-stone-200">Nombre del torneo</span>
                  <input className={getControlClass(fieldErrors, "name")} name="name" placeholder="Primera Copa Billar en Linea" required />
                  {renderFieldError("name")}
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-stone-200">Formato</span>
                  <select className={getControlClass(fieldErrors, "format", "select")} name="format" defaultValue="GROUPS_AND_ELIMINATION" required>
                    {TOURNAMENT_FORMATS.map((format) => (
                      <option key={format} value={format}>{format}</option>
                    ))}
                  </select>
                  {renderFieldError("format")}
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-stone-200">Estado</span>
                  <select className={getControlClass(fieldErrors, "status", "select")} name="status" defaultValue="OPEN" required>
                    {TOURNAMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {renderFieldError("status")}
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-200">Descripción corta</span>
                <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-accent" name="shortDescription" placeholder="Torneo oficial de carambola a 3 bandas para Primera y Elite." />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-200">Descripción completa</span>
                <textarea className="min-h-28 rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-accent" name="description" placeholder="Cuenta de qué trata el torneo, cómo se juega y qué hace atractiva la jornada." />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-200">Detalle del formato</span>
                <textarea className="min-h-24 rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-accent" name="formatDetails" placeholder="Grupos de 3, clasifican 2 por grupo y luego cuadro de eliminación directa." />
              </label>
              </div>

              <div className={`${currentStep === 1 ? "grid" : "hidden"} gap-5`}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-medium text-stone-200">Inicio</span>
                  <input className={`${getControlClass(fieldErrors, "startDate")} [color-scheme:dark] text-sm`} type="datetime-local" name="startDate" required />
                  {renderFieldError("startDate")}
                </label>

                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-medium text-stone-200">Cierre inscripción</span>
                  <input className={`${getControlClass(fieldErrors, "registrationDeadline")} [color-scheme:dark] text-sm`} type="datetime-local" name="registrationDeadline" required />
                  {renderFieldError("registrationDeadline")}
                </label>

                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-medium text-stone-200">Cupos</span>
                  <input className={getControlClass(fieldErrors, "maxParticipants")} type="number" name="maxParticipants" min={2} defaultValue={16} required />
                  {renderFieldError("maxParticipants")}
                </label>

                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-medium text-stone-200">Inscripción</span>
                  <input className={getControlClass(fieldErrors, "entryFee")} type="number" name="entryFee" min={1} defaultValue={50000} required />
                  {renderFieldError("entryFee")}
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-medium text-stone-200">Jugadores por grupo</span>
                  <input className={getControlClass(fieldErrors, "playersPerGroup")} type="number" name="playersPerGroup" min={3} max={5} defaultValue={3} />
                  {renderFieldError("playersPerGroup")}
                </label>

                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-medium text-stone-200">Mesas para grupos</span>
                  <input className={getControlClass(fieldErrors, "groupStageTables")} type="number" name="groupStageTables" min={1} defaultValue={5} />
                  {renderFieldError("groupStageTables")}
                </label>

                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-medium text-stone-200">Teléfono contacto</span>
                  <input className={getControlClass(fieldErrors, "contactPhone")} name="contactPhone" placeholder="+573001234567" />
                  {renderFieldError("contactPhone")}
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-200">Horarios de grupos</span>
                <textarea
                  className={getControlClass(fieldErrors, "groupStageSlotsText", "textarea")}
                  name="groupStageSlotsText"
                  placeholder={"2026-05-13,16:00,19:00,Jornada tarde\n2026-05-14,09:00,12:00,Jornada manana"}
                />
                <span className="text-xs leading-6 text-white/48">
                  Escribe una franja por línea usando: fecha,horaInicio,horaFin opcional,etiqueta opcional.
                </span>
                {renderFieldError("groupStageSlotsText")}
              </label>
              </div>

              <div className={`${currentStep === 2 ? "grid" : "hidden"} gap-5`}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-stone-200">Sede o club</span>
                  <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none focus:border-accent" name="venueName" placeholder="Club de Billares Privilege" />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-stone-200">Ubicación visible</span>
                  <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none focus:border-accent" name="location" placeholder="Medellín, Antioquia" />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm font-medium text-stone-200">Dirección</span>
                  <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none focus:border-accent" name="address" placeholder="Calle 45 #12-30, Barrio Centro" />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-stone-200">Ciudad</span>
                  <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none focus:border-accent" name="city" placeholder="Medellín" />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-stone-200">Streaming</span>
                  <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none focus:border-accent" name="streamUrl" placeholder="https://youtube.com/live/..." />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-stone-200">País</span>
                  <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none focus:border-accent" name="country" defaultValue="Colombia" />
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/82">
                    <input className="h-4 w-4 accent-[var(--accent)]" type="checkbox" name="isFeatured" />
                    <span>Marcar como destacado en la portada</span>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-stone-200">Publicación</span>
                    <input className={`${getControlClass(fieldErrors, "publishedAt")} [color-scheme:dark] text-sm`} type="datetime-local" name="publishedAt" />
                    {renderFieldError("publishedAt")}
                  </label>
                </div>

                <div className="grid gap-3 rounded-[1.5rem] border border-dashed border-[rgba(246,196,79,0.24)] bg-[linear-gradient(180deg,rgba(246,196,79,0.08),rgba(13,110,174,0.08))] p-4">
                  <span className="text-sm font-medium text-stone-100">Imagen del torneo</span>
                  <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border border-white/10 bg-black/24 px-4 py-5 text-center text-sm text-white/72 transition hover:border-accent/40 hover:bg-black/30">
                    <input className="hidden" type="file" name="image" accept="image/*" onChange={handleFileChange} />
                    <span className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-accent-soft">Upload</span>
                    <span className="mt-3 max-w-[14rem] leading-6">Selecciona JPG, PNG, WEBP, GIF o AVIF. El archivo se sube primero a Cloudinary.</span>
                    {selectedFileName ? <span className="mt-4 rounded-full border border-white/12 px-3 py-1 text-xs text-white/82">{selectedFileName}</span> : null}
                  </label>

                  <div className="relative min-h-36 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/22">
                    {previewUrl ? (
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${previewUrl})` }} />
                    ) : null}
                    <div className={`relative flex min-h-36 items-end p-4 ${previewUrl ? "bg-gradient-to-t from-black/82 via-black/28 to-transparent" : ""}`}>
                      <p className="text-sm leading-6 text-white/72">
                        {previewUrl ? "Vista previa local antes de subir la imagen." : "Aquí verás una vista previa rápida del archivo seleccionado."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              <div className={`${currentStep === 3 ? "grid" : "hidden"} gap-5`}>
              <fieldset className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <legend className="px-2 text-sm font-semibold text-stone-100">Categorías permitidas</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {PLAYER_CATEGORIES.map((category) => (
                    <label key={category} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/18 px-4 py-3 text-sm text-white/82">
                      <input className="h-4 w-4 accent-[var(--accent)]" type="checkbox" name="allowedCategories" value={category} />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <legend className="px-2 text-sm font-semibold text-stone-100">Premios base</legend>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div className="grid gap-3">
                    <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none focus:border-accent" name="firstPrizeDescription" placeholder="Primer puesto: Taco Predator + $500.000" />
                    <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none focus:border-accent" type="number" min={0} name="firstPrizeAmount" placeholder="500000" />
                  </div>
                  <div className="grid gap-3">
                    <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none focus:border-accent" name="secondPrizeDescription" placeholder="Segundo puesto: Juego de bolas Diamond" />
                    <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none focus:border-accent" type="number" min={0} name="secondPrizeAmount" placeholder="0" />
                  </div>
                </div>
              </fieldset>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/82">
                <input className="h-4 w-4 accent-[var(--accent)]" type="checkbox" name="withHandicap" />
                <span>Permitir handicap por jugador</span>
              </label>
              </div>

              <details className="rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4">
                <summary className="cursor-pointer list-none text-sm font-semibold text-white">SEO avanzado opcional</summary>
                <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-stone-200">SEO title</span>
                    <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none focus:border-accent" name="seoTitle" placeholder="Primera Copa Billar en Linea | Torneo oficial" />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-stone-200">SEO description</span>
                    <textarea className="min-h-24 rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-3 text-white outline-none focus:border-accent" name="seoDescription" placeholder="Resumen corto para Google y redes sociales." />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-stone-200">Etiquetas SEO</span>
                    <input className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white outline-none focus:border-accent" name="tags" placeholder="billar, carambola, torneo medellin, 3 bandas" />
                    <span className="text-xs leading-6 text-white/48">Sepáralas por comas para enviarlas como palabras clave del torneo.</span>
                  </label>
                  </div>
                  <div className="rounded-[1.3rem] border border-white/8 bg-black/18 p-4 text-sm leading-7 text-white/62">
                    Si no llenas SEO, el torneo igual se crea. Este bloque queda aparte para no frenar el flujo operativo principal.
                  </div>
                </div>
              </details>

              <div className={`${currentStep === 4 ? "grid" : "hidden"} gap-5`}>
                <section className="rounded-[1.6rem] border border-[rgba(246,196,79,0.16)] bg-[linear-gradient(180deg,rgba(246,196,79,0.06),rgba(255,255,255,0.025))] p-5">
                  <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]">Resumen previo</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <article className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/44">Torneo</p>
                      <p className="mt-2 text-base font-semibold text-white">{draftSummary.name || "Pendiente"}</p>
                      <p className="mt-1 text-sm text-white/58">{draftSummary.format} · {draftSummary.status}</p>
                    </article>
                    <article className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/44">Agenda</p>
                      <p className="mt-2 text-base font-semibold text-white">{draftSummary.startDate || "Sin inicio"}</p>
                      <p className="mt-1 text-sm text-white/58">Cierre: {draftSummary.registrationDeadline || "Sin cierre"}</p>
                    </article>
                    <article className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/44">Capacidad</p>
                      <p className="mt-2 text-base font-semibold text-white">{draftSummary.maxParticipants || "0"} cupos</p>
                      <p className="mt-1 text-sm text-white/58">Inscripcion: {draftSummary.entryFee || "0"}</p>
                    </article>
                    <article className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/44">Sede</p>
                      <p className="mt-2 text-base font-semibold text-white">{draftSummary.venueName || "Sin sede"}</p>
                      <p className="mt-1 text-sm text-white/58">{draftSummary.city || "Ciudad pendiente"}</p>
                    </article>
                    <article className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/44">Reglas</p>
                      <p className="mt-2 text-base font-semibold text-white">{draftSummary.categoriesCount} categorias activas</p>
                      <p className="mt-1 text-sm text-white/58">{draftSummary.groupSlotsCount} franjas de grupos</p>
                    </article>
                    <article className="rounded-[1.2rem] border border-white/8 bg-black/18 p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/44">SEO</p>
                      <p className="mt-2 text-base font-semibold text-white">{draftSummary.seoTitle || "Sin SEO personalizado"}</p>
                      <p className="mt-1 text-sm text-white/58">Bloque avanzado opcional</p>
                    </article>
                  </div>
                </section>
              </div>

              <div className="flex flex-col gap-3 rounded-[1.4rem] border border-white/8 bg-black/16 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white/82 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    onClick={() => setCurrentStep((current) => Math.max(current - 1, 0))}
                    disabled={currentStep === 0 || isPending}
                  >
                    Paso anterior
                  </button>
                  {currentStep < FORM_STEPS.length - 1 ? (
                    <button
                      className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-[#0c0d11] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
                      type="button"
                      onClick={handleNextStep}
                      disabled={isPending}
                    >
                      Siguiente paso
                    </button>
                  ) : (
                    <button className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-[#0c0d11] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isPending}>
                      {isPending ? "Subiendo imagen y creando torneo..." : "Crear torneo de prueba"}
                    </button>
                  )}
                </div>
                <p className="text-sm leading-6 text-white/52">La petición usa tu cookie actual con credentials: include.</p>
              </div>

              <div className={`min-h-20 rounded-[1.35rem] px-4 py-4 text-sm leading-7 ${state.kind === "success"
                ? "border border-emerald-400/35 bg-emerald-950/30 text-emerald-50"
                : state.kind === "error"
                  ? "border border-rose-400/35 bg-rose-950/25 text-rose-50"
                  : "border border-dashed border-white/10 bg-black/16 text-white/74"
              }`}>
                {state.kind === "idle" && (
                  <p>Completa los datos mínimos, selecciona una imagen y envía. Si el upload funciona, el formulario usa la url devuelta por Cloudinary como imageUrl del torneo.</p>
                )}

                {state.kind === "success" && (
                  <div className="grid gap-2">
                    <p className="font-semibold text-emerald-200">Torneo creado correctamente.</p>
                    {state.message ? <p>{state.message}</p> : null}
                    {state.tournamentId ? <p>ID creado: {state.tournamentId}</p> : null}
                    {state.tournamentSlug ? <p>Slug generado: {state.tournamentSlug}</p> : null}
                    {state.uploadedImageUrl ? <p className="break-all">Imagen subida: {state.uploadedImageUrl}</p> : null}
                  </div>
                )}

                {state.kind === "error" && <p>{state.message}</p>}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}