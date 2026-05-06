import mongoose, { Document, Schema } from "mongoose";
import { PlayerCategory, TournamentStatus, TournamentFormat } from "./enums.js";

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Premio para una posición del torneo.
 *
 * Ejemplo:
 *   { position: 1, description: "Taco Predator + $1.000.000", amount: 1000000 }
 *   { position: 2, description: "Juego de bolas Diamond",     amount: 0 }
 *   { position: 3, description: "Tiza Viking x12",            amount: 0 }
 */
export interface IPrize {
  position: number;    // Número de posición (1 = campeón, 2 = subcampeón, etc.)
  description: string; // Descripción completa del premio
  amount?: number;     // Monto en pesos si hay premio en efectivo (opcional)
}

export interface IGroupStageSlot {
  _id?: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime?: string;
  label?: string;
}

/**
 * Torneo de billar.
 *
 * Ciclo de vida típico:
 *   DRAFT → OPEN (abres inscripciones) → CLOSED → IN_PROGRESS → FINISHED
 */
export interface ITournament {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  formatDetails?: string;
  format: TournamentFormat;       // Cómo se estructura la competencia
  status: TournamentStatus;       // En qué etapa está el torneo

  allowedCategories: PlayerCategory[]; // Qué categorías pueden inscribirse
  maxParticipants: number;             // Cupo máximo de jugadores
  currentParticipants: number;         // Cuántos se han inscrito y confirmado

  entryFee: number; // Costo de inscripción (0 si es gratis)
  prizes: IPrize[]; // Lista de premios por posición

  startDate: Date;             // Cuándo empieza el torneo
  endDate?: Date;              // Cuándo termina (se llena cuando finaliza)
  registrationDeadline: Date;  // Fecha límite para inscribirse
  discount20Deadline?: Date;   // Hasta cuándo aplica el 20% de descuento
  discount10Deadline?: Date;   // Hasta cuándo aplica el 10% de descuento

  venueName?: string;  // Nombre comercial del club o sede
  location?: string;   // Dirección del lugar si es presencial
  address?: string;    // Dirección detallada para mapas y SEO local
  city?: string;
  country?: string;
  streamUrl?: string;  // Link de YouTube/Facebook si hay transmisión
  imageUrl?: string;   // Imagen promocional del torneo
  contactPhone?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  isFeatured: boolean;
  publishedAt?: Date;

  /**
   * Cuántos jugadores van en cada grupo de la fase inicial.
   * Solo aplica cuando format = GROUPS o GROUPS_AND_ELIMINATION.
   *
   * Ejemplos:
   *   3 → grupos de 3 (cada jugador juega 2 partidos de grupo)
   *   4 → grupos de 4 (cada jugador juega 3 partidos de grupo)  ← lo más común
   *   5 → grupos de 5 (cada jugador juega 4 partidos de grupo)
   *
   * Si no se establece, el servicio usará 3 por defecto.
   */
  playersPerGroup?: number;

  /**
   * Cuántas mesas simultáneas hay disponibles para la fase de grupos.
   * La capacidad de cada franja se calcula como:
   *   groupStageTables * playersPerGroup
   */
  groupStageTables?: number;

  /**
   * Franjas disponibles para jugar la fase de grupos.
   * Cada jugador elige una de estas opciones al inscribirse.
   */
  groupStageSlots?: IGroupStageSlot[];

  /**
   * Si true, cada jugador tiene un handicap diferente (carambolas requeridas para ganar).
   * Si false, todos los jugadores hacen las mismas carambolas (sin handicap).
   * Default: false
   */
  withHandicap: boolean;

  // Quién creó el torneo (debe ser un admin o staff)
  createdBy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * ITournamentDocument: ITournament + métodos de mongoose + virtuals
 */
export interface ITournamentDocument extends ITournament, Document {
  // Virtual: true si el torneo ya está lleno (currentParticipants >= maxParticipants)
  readonly isFull: boolean;

  // Virtual: true si las inscripciones están abiertas Y la fecha límite no pasó
  readonly isRegistrationOpen: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-ESQUEMA DE PREMIO
// ─────────────────────────────────────────────────────────────────────────────

const prizeSchema = new Schema<IPrize>(
  {
    position: {
      type: Number,
      required: true,
      min: 1, // La posición mínima es 1 (primer lugar)
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }, // Sin _id propio para cada premio
);

const groupStageSlotSchema = new Schema<IGroupStageSlot>(
  {
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
    },
    label: {
      type: String,
      trim: true,
    },
  },
);

function normalizeOptionalDate(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
}

function slugifyTournamentValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "torneo";
}

function isValidTimeValue(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function normalizeDayValue(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function ensureUniqueTournamentSlug(tournament: ITournamentDocument) {
  const TournamentModel = tournament.constructor as mongoose.Model<ITournamentDocument>;
  const rawValue = tournament.name;
  const baseSlug = slugifyTournamentValue(rawValue);

  let candidate = baseSlug;
  let suffix = 2;

  while (await TournamentModel.exists({ slug: candidate, _id: { $ne: tournament._id } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  tournament.slug = candidate;
}

// ─────────────────────────────────────────────────────────────────────────────
// ESQUEMA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

const tournamentSchema = new Schema<ITournamentDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: String,
    shortDescription: String,
    formatDetails: String,
    format: {
      type: String,
      enum: Object.values(TournamentFormat),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TournamentStatus),
      default: TournamentStatus.DRAFT, // Empieza como borrador hasta que lo publiques
    },
    allowedCategories: {
      type: [String],
      enum: Object.values(PlayerCategory),
      default: [], // Vacío = todas las categorías pueden inscribirse
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 2, // Un torneo necesita al menos 2 participantes
    },
    currentParticipants: {
      type: Number,
      default: 0,
      min: 0,
    },
    entryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    prizes: {
      type: [prizeSchema],
      default: [],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    registrationDeadline: {
      type: Date,
      required: true,
    },
    discount20Deadline: {
      type: Date,
      set: normalizeOptionalDate,
    },
    discount10Deadline: {
      type: Date,
      set: normalizeOptionalDate,
    },
    venueName: String,
    location: String,
    address: String,
    city: String,
    country: {
      type: String,
      default: 'Colombia',
    },
    streamUrl: String,
    imageUrl: String,
    contactPhone: String,
    seoTitle: String,
    seoDescription: String,
    tags: {
      type: [String],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      set: normalizeOptionalDate,
    },
    playersPerGroup: {
      type: Number,
      min: 3,  // Mínimo 3 jugadores por grupo
      max: 5,  // Máximo 5 jugadores por grupo
      // Por defecto no se establece; el servicio asume 4 si no está definido
    },
    groupStageTables: {
      type: Number,
      min: 1,
    },
    groupStageSlots: {
      type: [groupStageSlotSchema],
      default: [],
    },
    withHandicap: {
      type: Boolean,
      default: false, // Por defecto sin handicap (todos hacen las mismas carambolas)
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // Referencia al admin/staff que creó el torneo
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// ÍNDICES
// ─────────────────────────────────────────────────────────────────────────────

// Para listar torneos próximos o en curso (la query más común en la web)
tournamentSchema.index({ status: 1, startDate: 1 });

// Para resolver páginas públicas por URL amigable sin lookup por ObjectId
tournamentSchema.index({ slug: 1 }, { unique: true });

// Para filtrar torneos por categoría de jugador cuando un usuario quiere inscribirse
tournamentSchema.index({ allowedCategories: 1, status: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// VIRTUALS
// ─────────────────────────────────────────────────────────────────────────────

// true si el torneo ya llegó al máximo de participantes confirmados
tournamentSchema.virtual("isFull").get(function (this: ITournamentDocument) {
  return this.currentParticipants >= this.maxParticipants;
});

// true si se puede inscribir alguien más:
// - El torneo debe estar en estado OPEN
// - La fecha límite de inscripción no debe haber pasado
// - Se usa con isFull para mostrar "Inscríbete" o "Cupos llenos" en la web
tournamentSchema.virtual("isRegistrationOpen").get(function (
  this: ITournamentDocument,
) {
  const deadlineNotPassed = new Date() <= this.registrationDeadline;
  return this.status === TournamentStatus.OPEN && deadlineNotPassed;
});

tournamentSchema.pre("validate", async function () {
  const tournament = this as ITournamentDocument;

  await ensureUniqueTournamentSlug(tournament);

  if (tournament.entryFee <= 0) {
    throw new Error("El costo de inscripción del torneo debe ser mayor a 0.");
  }

  if (tournament.registrationDeadline >= tournament.startDate) {
    throw new Error("La fecha límite de inscripción debe ser anterior al inicio del torneo.");
  }

  if (tournament.discount20Deadline && tournament.discount20Deadline >= tournament.startDate) {
    throw new Error("La fecha del descuento del 20% debe ser anterior al inicio del torneo.");
  }

  if (tournament.discount10Deadline && tournament.discount10Deadline >= tournament.startDate) {
    throw new Error("La fecha del descuento del 10% debe ser anterior al inicio del torneo.");
  }

  if (
    tournament.discount20Deadline &&
    tournament.discount10Deadline &&
    tournament.discount20Deadline >= tournament.discount10Deadline
  ) {
    throw new Error("La fecha del descuento del 20% debe ser anterior a la del 10%.");
  }

  if ((tournament.groupStageSlots?.length ?? 0) > 0 && !tournament.groupStageTables) {
    throw new Error("Debes definir cuántas mesas hay disponibles para los horarios de grupos.");
  }

  const normalizedStartDate = normalizeDayValue(tournament.startDate);
  const normalizedEndDate = normalizeDayValue(tournament.endDate ?? tournament.startDate);
  const slotKeys = new Set<string>();

  for (const slot of tournament.groupStageSlots ?? []) {
    if (!isValidTimeValue(slot.startTime)) {
      throw new Error("Cada horario de grupos debe definir una hora de inicio con formato HH:MM.");
    }

    if (slot.endTime && !isValidTimeValue(slot.endTime)) {
      throw new Error("La hora final del horario de grupos debe usar el formato HH:MM.");
    }

    if (slot.endTime && slot.startTime >= slot.endTime) {
      throw new Error("La hora inicial de un horario de grupos debe ser anterior a la hora final.");
    }

    const normalizedSlotDate = normalizeDayValue(slot.date);

    if (normalizedSlotDate < normalizedStartDate || normalizedSlotDate > normalizedEndDate) {
      throw new Error("Los días de grupos deben estar dentro del rango de fechas del torneo.");
    }

    const slotKey = `${normalizedSlotDate.toISOString()}-${slot.startTime}-${slot.endTime ?? ""}`;
    if (slotKeys.has(slotKey)) {
      throw new Error("No puedes repetir el mismo día y horario en la agenda de grupos.");
    }

    slotKeys.add(slotKey);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTACIÓN
// ─────────────────────────────────────────────────────────────────────────────

const Tournament = mongoose.model<ITournamentDocument>(
  "Tournament",
  tournamentSchema,
);

export default Tournament;
