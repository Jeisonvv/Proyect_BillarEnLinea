"use client";

export type ConfirmModalTone = "default" | "danger";

export type ConfirmModalProps = {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
  /** Texto pequeño en mayúsculas sobre el título. */
  eyebrow?: string;
  /** Título principal del modal. */
  title?: string;
  /** Descripción / pregunta de confirmación. */
  description?: string;
  /** Etiqueta del botón principal de confirmación. */
  confirmLabel?: string;
  /** Etiqueta del botón secundario que cierra el modal. */
  cancelLabel?: string;
  /** Tono del botón principal. `danger` aplica colores rojos. */
  tone?: ConfirmModalTone;
  /** Deshabilita los botones (por ejemplo mientras se procesa la acción). */
  disabled?: boolean;
};

/**
 * Modal de confirmación reutilizable, con la misma estética que `AuthPromptModal`.
 * Pensado para reemplazar `window.confirm` en acciones destructivas o relevantes.
 */
export function ConfirmModal({
  open,
  onConfirm,
  onClose,
  eyebrow = "Confirmar acción",
  title = "¿Quieres continuar?",
  description = "Por favor confirma la acción para continuar.",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  disabled = false,
}: ConfirmModalProps) {
  if (!open) return null;

  const confirmClass = tone === "danger"
    ? "rounded-full bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-60"
    : "rounded-full bg-accent px-4 py-3 text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/72 px-4">
      <div className="w-full max-w-md rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,18,26,0.98),rgba(10,13,19,0.98))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.76)]">{eyebrow}</p>
        <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-white/74">{description}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            className="rounded-full border border-white/12 px-4 py-3 text-sm font-medium text-white/82 transition hover:bg-white/8 disabled:opacity-60"
            type="button"
            onClick={onClose}
            disabled={disabled}
          >
            {cancelLabel}
          </button>
          <button
            className={confirmClass}
            type="button"
            onClick={onConfirm}
            disabled={disabled}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
