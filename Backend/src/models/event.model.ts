import mongoose, { Document, Schema } from "mongoose";
import {
  EventRegistrationMode,
  EventStatus,
  EventTicketingMode,
  EventTier,
  EventType,
} from "./enums.js";

export interface IEventPrize {
  position: number;
  description: string;
  amount?: number;
}

export interface IEvent {
  name: string;
  slug: string;
  description?: string;
  type: EventType;
  tier: EventTier;
  status: EventStatus;
  organizer?: string;
  location?: string;
  city?: string;
  department?: string;
  country: string;
  startDate: Date;
  endDate?: Date;
  entryFee?: number;
  registrationMode: EventRegistrationMode;
  imageUrl?: string;
  streamUrl?: string;
  registrationUrl?: string;
  hasGrandstand: boolean;
  grandstandDetails?: string;
  ticketingMode: EventTicketingMode;
  ticketPrice?: number;
  ticketUrl?: string;
  resultsUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  featured: boolean;
  prizes: IEventPrize[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventDocument extends IEvent, Document {
  readonly isUpcoming: boolean;
  readonly isActive: boolean;
}

const eventPrizeSchema = new Schema<IEventPrize>(
  {
    position: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
  },
  { _id: false },
);

function slugifyEventValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "evento";
}

async function ensureUniqueEventSlug(event: IEventDocument) {
  const EventModel = event.constructor as mongoose.Model<IEventDocument>;
  const baseSlug = slugifyEventValue(event.name);

  let candidate = baseSlug;
  let suffix = 2;

  while (await EventModel.exists({ slug: candidate, _id: { $ne: event._id } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  event.slug = candidate;
}

const eventSchema = new Schema<IEventDocument>(
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
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(EventType),
      required: true,
    },
    tier: {
      type: String,
      enum: Object.values(EventTier),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.SCHEDULED,
    },
    organizer: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: "Colombia",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    entryFee: {
      type: Number,
      min: 0,
      default: 0,
    },
    registrationMode: {
      type: String,
      enum: Object.values(EventRegistrationMode),
      default: EventRegistrationMode.NONE,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    streamUrl: {
      type: String,
      trim: true,
    },
    registrationUrl: {
      type: String,
      trim: true,
    },
    hasGrandstand: {
      type: Boolean,
      default: false,
    },
    grandstandDetails: {
      type: String,
      trim: true,
    },
    ticketingMode: {
      type: String,
      enum: Object.values(EventTicketingMode),
      default: EventTicketingMode.NO_TICKETS,
    },
    ticketPrice: {
      type: Number,
      min: 0,
    },
    ticketUrl: {
      type: String,
      trim: true,
    },
    resultsUrl: {
      type: String,
      trim: true,
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    prizes: {
      type: [eventPrizeSchema],
      default: [],
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

eventSchema.index({ slug: 1 }, { unique: true });
eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ tier: 1, type: 1, startDate: 1 });
eventSchema.index({ featured: 1, startDate: 1 });

eventSchema.pre("validate", async function () {
  const event = this as IEventDocument;
  await ensureUniqueEventSlug(event);
});

eventSchema.virtual("isUpcoming").get(function (this: IEventDocument) {
  return this.startDate > new Date() && this.status === EventStatus.SCHEDULED;
});

eventSchema.virtual("isActive").get(function (this: IEventDocument) {
  return this.status === EventStatus.LIVE;
});

const Event = mongoose.model<IEventDocument>("Event", eventSchema);

export default Event;