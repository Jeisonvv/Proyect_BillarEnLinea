"use client";

import { useEffect, useState, useTransition } from "react";
import { ApiError } from "@/lib/api/client";
import { getCurrentSession, loginWeb, logoutWeb } from "@/lib/api/auth";

type LoginState = {
  kind: "loading" | "idle" | "success" | "error";
  message?: string;
  userName?: string;
};

const initialState: LoginState = { kind: "loading" };

export function LoginForm() {
  const [state, setState] = useState<LoginState>(initialState);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isActive = true;

    void (async () => {
      try {
        const response = await getCurrentSession();
        if (!isActive) {
          return;
        }

        setState({
          kind: "success",
          message: "Sesion detectada desde la cookie actual del backend.",
          userName: response.user.name ?? response.user.email,
        });
      } catch {
        if (!isActive) {
          return;
        }

        setState({ kind: "idle" });
      }
    })();

    return () => {
      isActive = false;
    };
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      try {
        const response = await loginWeb({ email, password });
        setState({
          kind: "success",
          message: "Sesion iniciada. La cookie del backend ya quedo creada en el navegador.",
          userName: response.user.name ?? response.user.email,
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
                : "No fue posible iniciar sesion.",
        });
      }
    });
  }

  function handleLogout() {
    startTransition(async () => {
      try {
        const response = await logoutWeb();
        setState({
          kind: "idle",
          message: response.message,
        });
      } catch (error) {
        setState({
          kind: "error",
          message:
            error instanceof ApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : "No fue posible cerrar sesion.",
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

      <label className="grid gap-2">
        <span className="text-sm font-medium text-stone-200">Password</span>
        <input
          className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-base text-white outline-none placeholder:text-stone-500 focus:border-accent"
          type="password"
          name="password"
          placeholder="Tu clave"
          autoComplete="current-password"
          required
        />
      </label>

      <button
        className="mt-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isPending || state.kind === "success"}
      >
        {isPending ? "Ingresando..." : "Iniciar sesion"}
      </button>

      {state.kind === "success" && (
        <button
          className="rounded-full border border-white/10 bg-white/8 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-70"
          type="button"
          disabled={isPending}
          onClick={handleLogout}
        >
          {isPending ? "Cerrando sesion..." : "Cerrar sesion"}
        </button>
      )}

      <div className="min-h-14 rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-3 text-sm leading-6 text-stone-300">
        {state.kind === "loading" && (
          <p>Consultando si ya existe una sesion guardada en el navegador...</p>
        )}

        {state.kind === "idle" && (
          <p>
            {state.message ?? "Este formulario llama a POST /api/auth/login con credentials: include para que el backend escriba la cookie httpOnly."}
          </p>
        )}

        {state.kind === "success" && (
          <p>
            {state.message}
            {state.userName ? ` Usuario autenticado: ${state.userName}.` : ""}
          </p>
        )}

        {state.kind === "error" && <p>{state.message}</p>}
      </div>
    </form>
  );
}