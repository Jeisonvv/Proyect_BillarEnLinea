"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ApiError } from "@/lib/api/client";
import { registerWeb } from "@/lib/api/auth";

type RegisterState = {
  kind: "idle" | "success" | "error";
  message?: string;
};

const initialState: RegisterState = { kind: "idle" };

export function RegisterForm() {
  const [state, setState] = useState<RegisterState>(initialState);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const identityDocument = String(formData.get("identityDocument") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setState({ kind: "error", message: "Las contraseñas no coinciden." });
      return;
    }

    startTransition(async () => {
      try {
        const response = await registerWeb({
          name,
          email,
          phone,
          identityDocument,
          password,
        });

        setState({
          kind: "success",
          message: `Cuenta creada para ${response.data.name ?? response.data.email ?? "el nuevo usuario"}. Ya puedes iniciar sesion.`,
        });
        form.reset();
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
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-stone-200">Nombre completo</span>
        <input
          className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-base text-white outline-none placeholder:text-stone-500 focus:border-accent"
          type="text"
          name="name"
          placeholder="Jeison Vargas"
          autoComplete="name"
          required
        />
      </label>

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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
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

        <label className="grid gap-2">
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

      <button
        className="mt-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Creando cuenta..." : "Registrarme"}
      </button>

      <div className="min-h-14 rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-3 text-sm leading-6 text-stone-300">
        {state.kind === "idle" && (
          <p>Este formulario llama a POST /api/auth/register con los datos minimos que exige el backend.</p>
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