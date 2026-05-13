import mongoose, { Document, Schema } from "mongoose";
import { ActivityStatus } from "./enums.js";
import ActivityNumber, { isPowerOfTen } from "./activity-number.model.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE SLUG
// ─────────────────────────────────────────────────────────────────────────────

function slugifyActivityValue(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "rifa"
  );
}

async function ensureUniqueActivitySlug(activity: IActivityDocument) {
  const ActivityModel = activity.constructor as mongoose.Model<IActivityDocument>;
  // Si el usuario proporcionó un slug explícito, lo usamos como base; si no, lo derivamos del nombre.
  const rawValue = activity.slug && activity.slug.trim() ? activity.slug : activity.name;
  const baseSlug = slugifyActivityValue(rawValue);

  let candidate = baseSlug;
  let suffix = 2;

  while (await ActivityModel.exists({ slug: candidate, _id: { $ne: activity._id } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  activity.slug = candidate;
}

export { slugifyActivityValue };

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rifa organizada por el negocio.
 *
 * Una rifa tiene una cantidad fija de boletos numerados.
 * Los usuarios compran uno o varios boletos (ver ActivityTicket).
 * En la fecha del sorteo se elige un número ganador al azar.
 *
 * Ciclo de vida típico:
 *   DRAFT → ACTIVE (empezar venta) → CLOSED (cerrar venta) → DRAWN (sortear)
 */
export interface IActivity {
  name: string;
  slug: string;
  description?: string;
  status: ActivityStatus;

  // SEO
  seoTitle?: string;
  seoDescription?: string;

  // Etiquetas para filtrar/agrupar (ej: "navidad", "premium", "gratis")
  tags: string[];

  prize: string;          // Descripción del premio (ej: "Taco Predator REVO + maletín")
  prizeImageUrl?: string; // Foto del premio

  ticketPrice: number; // Precio por boleto
  totalTickets: number; // Cantidad total de boletos disponibles (10, 100, 1000, 10000, ...)
  soldTickets: number;  // Cuántos boletos han sido PAGADOS hasta ahora

  drawDate: Date; // Fecha y hora en que se realizará el sorteo

  // Se llenan DESPUÉS del sorteo
  hasWinner: boolean;                  // Indica si el número sorteado tuvo un usuario ganador válido
  winnerTicket?: string;                 // Número del boleto ganador respetando ceros a la izquierda
  winner?: mongoose.Types.ObjectId;      // Usuario ganador (ref a User)

  imageUrl?: string; // Imagen promocional de la rifa
  promoVideoUrl?: string; // URL de video promocional (YouTube, Vimeo, MP4, etc.)

  // Quién creó la rifa (admin o staff)
  createdBy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * IActivityDocument: IActivity + métodos de mongoose + virtuals
 */
export interface IActivityDocument extends IActivity, Document {
  // Virtual: boletos que aún están disponibles para comprar
  readonly availableTickets: number;

  // Virtual: true si ya se vendieron todos los boletos
  readonly isSoldOut: boolean;

  // Virtual: true cuando la rifa no requiere pago por boleto
  readonly isFree: boolean;

  // Virtual: true cuando la rifa requiere pago por boleto
  readonly requiresPayment: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// ESQUEMA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

const activitySchema = new Schema<IActivityDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    seoTitle: String,
    seoDescription: String,
    tags: {
      type: [String],
      default: [],
    },
    description: String,
    status: {
      type: String,
      enum: Object.values(ActivityStatus),
      default: ActivityStatus.DRAFT, // Empieza como borrador hasta que la actives
    },
    prize: {
      type: String,
      required: true,
    },
    prizeImageUrl: String,
    ticketPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalTickets: {
      type: Number,
      required: true,
      min: 10,
      validate: {
        validator: isPowerOfTen,
        message: "totalTickets debe ser una potencia de 10 (10, 100, 1000, ...).",
      },
    },
    soldTickets: {
      type: Number,
      default: 0,
      min: 0,
    },
    drawDate: {
      type: Date,
      required: true,
    },
    hasWinner: {
      type: Boolean,
      default: false,
    },
    winnerTicket: String,
    winner: {
      type: Schema.Types.ObjectId,
      ref: "User", // Referencia al usuario que ganó
    },
    imageUrl: String,
    promoVideoUrl: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

// Para listar rifas activas ordenadas por fecha de sorteo (las más próximas primero)
activitySchema.index({ status: 1, drawDate: 1 });

// Para resolver páginas públicas por URL amigable sin lookup por ObjectId
activitySchema.index({ slug: 1 }, { unique: true });

activitySchema.pre("validate", async function () {
  const activity = this as IActivityDocument;
  await ensureUniqueActivitySlug(activity);
});

activitySchema.pre("save", function () {
  if (!this.isNew && this.isModified("totalTickets")) {
    throw new Error("No puedes cambiar totalTickets después de crear la rifa.");
  }

  if (this.soldTickets > this.totalTickets) {
    throw new Error("soldTickets no puede ser mayor que totalTickets.");
  }

  this.$locals.wasNew = this.isNew;
});

activitySchema.post("save", async function (doc) {
  if (!doc.$locals.wasNew) return;

  await ActivityNumber.generateForActivity(doc._id, doc.totalTickets);
});

// ─────────────────────────────────────────────────────────────────────────────
// VIRTUALS
// ─────────────────────────────────────────────────────────────────────────────

// Boletos disponibles = total - vendidos
// Se calcula en tiempo real para mostrar "quedan X boletos"
activitySchema.virtual("availableTickets").get(function (this: IActivityDocument) {
  return this.totalTickets - this.soldTickets;
});

// true si ya no quedan boletos disponibles
activitySchema.virtual("isSoldOut").get(function (this: IActivityDocument) {
  return this.soldTickets >= this.totalTickets;
});

activitySchema.virtual("isFree").get(function (this: IActivityDocument) {
  return this.ticketPrice === 0;
});

activitySchema.virtual("requiresPayment").get(function (this: IActivityDocument) {
  return this.ticketPrice > 0;
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTACIÓN
// ─────────────────────────────────────────────────────────────────────────────

const Activity = mongoose.model<IActivityDocument>("Activity", activitySchema);

export default Activity;
