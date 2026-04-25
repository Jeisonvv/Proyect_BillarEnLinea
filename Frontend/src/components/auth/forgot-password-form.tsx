"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ApiError } from "@/lib/api/client";
import { forgotPassword } from "@/lib/api/auth";

type ForgotPasswordState = {
  kind: "idle" | "success" | "error";
  message?: string;
  resetUrl?: string;
  resetToken?: string;
};

const initialState: ForgotPasswordState = { kind: "idle" };

export function ForgotPasswordForm() {
  const [state, setState] = useState<ForgotPasswordState>(initialState);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();

    startTransition(async () => {
      try {
        const response = await forgotPassword({ email });
        setState({
          kind: "success",
          message: response.message,
          resetUrl: response.data?.resetUrl,
          resetToken: response.data?.resetToken,
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
                : "No fue posible iniciar la recuperacion.",
        });
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
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

      <button
        className="mt-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Enviando..." : "Enviar instrucciones"}
      </button>

      <div className="min-h-14 rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-3 text-sm leading-6 text-stone-300">
        {state.kind === "idle" && (
          <p>
            Envias tu email y el backend genera un token de recuperacion. En desarrollo, tambien puede devolver el enlace directo para probar el flujo sin correo real.
          </p>
        )}

        {state.kind === "success" && (
          <div className="space-y-3">
            <p>{state.message}</p>
            {state.resetUrl && (
              <p>
                En este entorno puedes continuar directamente aqui: {" "}
                <Link className="font-medium text-accent-soft underline underline-offset-4" href={state.resetUrl.replace(/^https?:\/\/[^/]+/, "") }>
                  abrir recuperacion
                </Link>
              </p>
            )}
            {state.resetToken && (
              <p className="break-all text-xs text-stone-400">
                Token temporal de desarrollo: {state.resetToken}
              </p>
            )}
          </div>
        )}

        {state.kind === "error" && <p>{state.message}</p>}
      </div>
    </form>
  );
}