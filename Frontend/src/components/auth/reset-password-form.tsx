"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ApiError } from "@/lib/api/client";
import { resetPassword } from "@/lib/api/auth";

type ResetPasswordState = {
  kind: "idle" | "success" | "error";
  message?: string;
};

const initialState: ResetPasswordState = { kind: "idle" };

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, setState] = useState<ResetPasswordState>(initialState);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!token) {
      setState({ kind: "error", message: "Falta el token de recuperacion en la URL." });
      return;
    }

    if (password !== confirmPassword) {
      setState({ kind: "error", message: "Las contraseñas no coinciden." });
      return;
    }

    startTransition(async () => {
      try {
        const response = await resetPassword({ token, password });
        setState({ kind: "success", message: response.message });
        form.reset();
      } catch (error) {
        setState({
          kind: "error",
          message:
            error instanceof ApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : "No fue posible restablecer la contraseña.",
        });
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-stone-200">Nueva password</span>
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
          placeholder="Repite la nueva password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      <button
        className="mt-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isPending || !token}
      >
        {isPending ? "Guardando..." : "Actualizar contraseña"}
      </button>

      <div className="min-h-14 rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-3 text-sm leading-6 text-stone-300">
        {!token && (
          <p>
            Falta el token en la URL. Vuelve a abrir el enlace del correo o usa el enlace de desarrollo generado en la pantalla anterior.
          </p>
        )}

        {token && state.kind === "idle" && (
          <p>El token ya está presente. Solo falta definir la nueva contraseña.</p>
        )}

        {state.kind === "success" && (
          <p>
            {state.message} {" "}
            <Link className="font-medium text-accent-soft underline underline-offset-4" href="/login">
              Volver al login
            </Link>
          </p>
        )}

        {state.kind === "error" && <p>{state.message}</p>}
      </div>
    </form>
  );
}