"use client";

import { useRouter } from "next/navigation";

export type AuthPromptModalProps = {
  open: boolean;
  onClose: () => void;
  /** Texto pequeño en mayúsculas sobre el título. */
  eyebrow?: string;
  /** Título principal del modal. */
  title?: string;
  /** Descripción que explica por qué se necesita iniciar sesión. */
  description?: string;
  /**
   * Ruta a la que redirigir tras iniciar sesión / registrarse.
   * Si se provee, se añade como `?redirect=` a `/login` y `/register`.
   */
  redirectTo?: string;
  /** Etiqueta del botón secundario que cierra el modal. */
  dismissLabel?: string;
};

/**
 * Modal compartido para invitar a iniciar sesión o crear cuenta.
 * Reemplaza la redirección directa a `/login` con una explicación clara.
 */
export function AuthPromptModal({
  open,
  onClose,
  eyebrow = "Acceso requerido",
  title = "Necesitas una cuenta para continuar",
  description = "Para esta acción debes iniciar sesión o crear una cuenta. Así podemos guardar tu información, tu participación y el estado de tu pago.",
  redirectTo,
  dismissLabel = "Seguir explorando",
}: AuthPromptModalProps) {
  const router = useRouter();

  if (!open) return null;

  const buildUrl = (path: string) =>
    redirectTo ? `${path}?redirect=${encodeURIComponent(redirectTo)}` : path;

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/72 px-4">
      <div className="w-full max-w-md rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,18,26,0.98),rgba(10,13,19,0.98))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">{eyebrow}</p>
        <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-white/74">{description}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            className="rounded-full border border-white/12 px-4 py-3 text-sm font-medium text-white/82 transition hover:bg-white/8"
            type="button"
            onClick={() => {
              onClose();
              router.push(buildUrl("/login"));
            }}
          >
            Iniciar sesión
          </button>
          <button
            className="rounded-full bg-accent px-4 py-3 text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong"
            type="button"
            onClick={() => {
              onClose();
              router.push(buildUrl("/register"));
            }}
          >
            Crear cuenta
          </button>
        </div>

        <button
          className="mt-3 w-full rounded-full border border-white/10 px-4 py-3 text-sm font-medium text-white/62 transition hover:bg-white/6 hover:text-white"
          type="button"
          onClick={onClose}
        >
          {dismissLabel}
        </button>
      </div>
    </div>
  );
}
