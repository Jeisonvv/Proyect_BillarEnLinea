"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ApiError } from "@/lib/api/client";
import { loginWeb, registerWeb } from "@/lib/api/auth";

const playerCategoryOptions = [
  { value: "TERCERA", label: "Tercera" },
  { value: "SEGUNDA", label: "Segunda" },
  { value: "PRIMERA", label: "Primera" },
  { value: "ELITE", label: "Elite" },
] as const;

const identityDocumentTypeOptions = [
  { value: "CEDULA_CIUDADANIA", label: "Cedula de ciudadania" },
  { value: "CEDULA_EXTRANJERIA", label: "Cedula de extranjeria" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "NIT", label: "NIT" },
] as const;

type RegisterState = {
  kind: "idle" | "success" | "error";
  message?: string;
};

type RegisterStep = 1 | 2;

const initialState: RegisterState = { kind: "idle" };

export function RegisterForm() {
  const router = useRouter();
  const [state, setState] = useState<RegisterState>(initialState);
  const [currentStep, setCurrentStep] = useState<RegisterStep>(1);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function validateStep(step: RegisterStep) {
    const form = formRef.current;
    if (!form) {
      return true;
    }

    const fieldsByStep: Record<RegisterStep, string[]> = {
      1: ["firstName", "lastName", "email", "identityDocumentType", "identityDocument"],
      2: ["phone", "playerCategory", "password", "confirmPassword"],
    };

    for (const fieldName of fieldsByStep[step]) {
      const field = form.elements.namedItem(fieldName);
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) {
        continue;
      }

      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }

    return true;
  }

  function handleNextStep() {
    if (!validateStep(1)) {
      return;
    }

    setState(initialState);
    setCurrentStep(2);
  }

  function handlePreviousStep() {
    setState(initialState);
    setCurrentStep(1);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateStep(2)) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const name = `${firstName} ${lastName}`.trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const identityDocumentType = String(formData.get("identityDocumentType") ?? "").trim() as
      | "CEDULA_CIUDADANIA"
      | "CEDULA_EXTRANJERIA"
      | "PASAPORTE"
      | "NIT";
    const identityDocument = String(formData.get("identityDocument") ?? "").trim();
    const playerCategory = String(formData.get("playerCategory") ?? "").trim() as
      | "TERCERA"
      | "SEGUNDA"
      | "PRIMERA"
      | "ELITE";
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setState({ kind: "error", message: "Las contraseñas no coinciden." });
      return;
    }

    startTransition(async () => {
      try {
        await registerWeb({
          name,
          email,
          phone,
          identityDocumentType,
          identityDocument,
          playerCategory,
          password,
        });

        await loginWeb({ email, password });

        form.reset();
        setCurrentStep(1);
        router.replace("/home");
        router.refresh();
      } catch (error) {
        setState({
          kind: "error",
          message:
            error instanceof ApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : "No fue posible crear la cuenta.",
        });
      }
    });
  }

  return (
    <form ref={formRef} className="grid gap-4 xl:gap-5" onSubmit={handleSubmit}>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[0.72rem] uppercase tracking-[0.24em] text-stone-400">
          <span>Paso {currentStep} de 2</span>
          <span>{currentStep === 1 ? "50%" : "100%"}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#f6c44f_0%,#ffd76f_100%)] transition-all duration-300 ease-out"
            style={{ width: currentStep === 1 ? "50%" : "100%" }}
          />
        </div>
      </div>

      <div className={currentStep === 1 ? "grid gap-4 xl:gap-5" : "hidden"}>
        <div className="grid gap-4 2xl:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-200">Nombres</span>
            <input
              className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-base text-white outline-none placeholder:text-stone-500 focus:border-accent"
              type="text"
              name="firstName"
              placeholder="Jeison David"
              autoComplete="given-name"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-200">Apellidos</span>
            <input
              className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-base text-white outline-none placeholder:text-stone-500 focus:border-accent"
              type="text"
              name="lastName"
              placeholder="Vargas Rojas"
              autoComplete="family-name"
              required
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-200">Email</span>
          <input
            className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-base text-white outline-none placeholder:text-stone-500 focus:border-accent"
            type="email"
            name="email"
            placeholder="juan@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label className="grid min-w-0 gap-2">
          <span className="text-sm font-medium text-stone-200">Tipo de documento</span>
          <select
            className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-base text-white outline-none focus:border-accent"
            name="identityDocumentType"
            defaultValue=""
            required
          >
            <option value="" disabled className="bg-[#201815] text-stone-400">
              Selecciona tu tipo de documento
            </option>
            {identityDocumentTypeOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#201815] text-white">
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid min-w-0 gap-2">
          <span className="text-sm font-medium text-stone-200">Documento</span>
          <input
            className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-base text-white outline-none placeholder:text-stone-500 focus:border-accent"
            type="text"
            name="identityDocument"
            placeholder="1234567890"
            required
          />
        </label>
      </div>

      <div className={currentStep === 2 ? "grid gap-4 xl:gap-5" : "hidden"}>
        <label className="grid min-w-0 gap-2">
          <span className="text-sm font-medium text-stone-200">Telefono</span>
          <input
            className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-base text-white outline-none placeholder:text-stone-500 focus:border-accent"
            type="tel"
            name="phone"
            placeholder="3001234567"
            autoComplete="tel"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-200">Categoria</span>
          <select
            className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-base text-white outline-none focus:border-accent"
            name="playerCategory"
            defaultValue=""
            required
          >
            <option value="" disabled className="bg-[#201815] text-stone-400">
              Selecciona tu categoria
            </option>
            {playerCategoryOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#201815] text-white">
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 2xl:grid-cols-2">
          <label className="grid min-w-0 gap-2">
            <span className="text-sm font-medium text-stone-200">Password</span>
            <input
              className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-base text-white outline-none placeholder:text-stone-500 focus:border-accent"
              type="password"
              name="password"
              placeholder="Minimo 8 caracteres"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <label className="grid min-w-0 gap-2">
            <span className="text-sm font-medium text-stone-200">Confirmar password</span>
            <input
              className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-base text-white outline-none placeholder:text-stone-500 focus:border-accent"
              type="password"
              name="confirmPassword"
              placeholder="Repite tu password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {currentStep === 2 ? (
          <button
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/8 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/14"
            type="button"
            onClick={handlePreviousStep}
            disabled={isPending}
          >
            Volver
          </button>
        ) : (
          <div className="hidden sm:block" />
        )}

        {currentStep === 1 ? (
          <button
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
            type="button"
            onClick={handleNextStep}
            disabled={isPending}
          >
            Continuar
          </button>
        ) : (
          <button
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Creando cuenta..." : "Registrarme"}
          </button>
        )}
      </div>

      <div className="min-h-14 rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-3 text-sm leading-6 text-stone-300">
        {state.kind === "idle" && (
          <p>
            {currentStep === 1
              ? "Empieza con tus datos de identidad. En el siguiente paso completarás categoria, telefono y contraseña."
              : "Define tu categoria competitiva y crea tu acceso para terminar el registro."}
          </p>
        )}

        {state.kind === "success" && (
          <p>
            {state.message} {" "}
            <Link className="font-medium text-accent-soft underline underline-offset-4" href="/login">
              Ir al login
            </Link>
          </p>
        )}

        {state.kind === "error" && <p>{state.message}</p>}
      </div>
    </form>
  );
}