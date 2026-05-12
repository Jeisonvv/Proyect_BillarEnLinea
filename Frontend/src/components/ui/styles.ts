/**
 * Tokens de estilos Tailwind reutilizables.
 *
 * Centralizan combinaciones de clases que se repetían en muchos componentes
 * (botones primarios, inputs admin, contenedores con gradiente, etc.).
 *
 * USO: importa la constante en lugar de re-escribir las clases. Si necesitas
 * extender estilos, concatena con `cn()` o template strings:
 *
 *   <button className={`${BUTTON_PRIMARY} mt-4`}>...</button>
 */

// ─────────────────────────────────────────────────────────────────────────────
// BOTONES
// ─────────────────────────────────────────────────────────────────────────────

/** Botón principal dorado (CTA). Usado en landing, user, admin. */
export const BUTTON_PRIMARY =
  "inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#0b0b0d] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60";

/** Variante compacta del botón primario (para barras y headers). */
export const BUTTON_PRIMARY_COMPACT =
  "inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[#0b0b0d] transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60";

/** Botón secundario / outline sobre fondo oscuro. */
export const BUTTON_GHOST =
  "inline-flex items-center justify-center rounded-full border border-white/14 bg-white/4 px-5 py-3 text-sm font-medium text-white/82 transition hover:border-white/25 hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

/** Botón destructivo (eliminar / liberar). */
export const BUTTON_DANGER =
  "inline-flex items-center justify-center rounded-full border border-rose-400/28 bg-rose-500/12 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/18 disabled:cursor-not-allowed disabled:opacity-70";

// ─────────────────────────────────────────────────────────────────────────────
// INPUTS
// ─────────────────────────────────────────────────────────────────────────────

/** Input/select/textarea para formularios admin. */
export const ADMIN_INPUT =
  "w-full rounded-[1rem] border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[rgba(246,196,79,0.55)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

// ─────────────────────────────────────────────────────────────────────────────
// CONTENEDORES / TARJETAS
// ─────────────────────────────────────────────────────────────────────────────

/** Tarjeta principal con gradiente sutil (paneles admin/user). */
export const CARD_SHELL =
  "rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]";

/** Tarjeta principal con padding por defecto. */
export const CARD_SHELL_PADDED = `${CARD_SHELL} p-6`;

/** Sub-sección con gradiente más claro (dentro de una tarjeta). */
export const CARD_INNER =
  "rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5";

// ─────────────────────────────────────────────────────────────────────────────
// LABELS / TEXTO
// ─────────────────────────────────────────────────────────────────────────────

/** Label uppercase tracking-widest para formularios y headers de sección. */
export const LABEL_OVERLINE = "text-[0.72rem] uppercase tracking-[0.18em] text-white/56";

/** Variante con color acento (titulares de sección admin). */
export const LABEL_OVERLINE_ACCENT = "text-[0.72rem] uppercase tracking-[0.28em] text-[#f6c44f]";
