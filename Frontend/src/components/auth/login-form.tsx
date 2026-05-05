"use client";


import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { loginWeb } from "@/lib/api/auth";

type LoginState = {
  kind: "idle" | "submitting" | "error";
  message?: string;
};

const initialState: LoginState = { kind: "idle" };

export function LoginForm() {
  const [state, setState] = useState<LoginState>(initialState);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextHref = searchParams.get("next");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      setState({ kind: "submitting" });

      try {
        await loginWeb({ email, password });
        form.reset();
        router.push(nextHref && nextHref.startsWith("/") ? nextHref : "/home");
      } catch (error) {
        setState({
          kind: "error",
          message:
            error instanceof ApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : "No fue posible iniciar sesion valija.",
        });
      }
    });
  }

  return (
    <form className="grid gap-4" method="post" onSubmit={handleSubmit}>
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
          placeholder="ejemplo: password123"
          autoComplete="current-password"
          required
        />
      </label>

      <button
        className="mt-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isPending || state.kind === "submitting"}
      >
        {isPending ? "Ingresando..." : "Iniciar sesion"}
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/8 px-5 py-3 text-center text-sm font-semibold text-stone-100 transition hover:bg-white/14"
          href="/register"
        >
          Registrarme
        </Link>
        <Link
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/8 px-5 py-3 text-center text-sm font-semibold text-stone-100 transition hover:bg-white/14"
          href="/forgot-password"
        >
          Olvide mi contraseña
        </Link>
      </div>

      <div className="min-h-14 rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-3 text-sm leading-6 text-stone-300">
        {state.kind === "idle" && (
          <p>
            {state.message ?? "Ingresa con tu correo y contraseña para continuar tu recorrido dentro de la plataforma."}
          </p>
        )}

        {state.kind === "submitting" && <p>Validando tus datos para iniciar sesion...</p>}

        {state.kind === "error" && <p>{state.message}</p>}
      </div>
    </form>
  );
}