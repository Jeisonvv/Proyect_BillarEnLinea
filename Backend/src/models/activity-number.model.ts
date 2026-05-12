import mongoose, { Document, Model, Schema } from "mongoose";
import { ActivityNumberStatus } from "./enums.js";

export function isPowerOfTen(value: number) {
  if (!Number.isInteger(value) || value < 10) return false;

  let current = value;
  while (current % 10 === 0) {
    current /= 10;
  }

  return current === 1;
}

export function getActivityNumberWidth(totalTickets: number) {
  return String(totalTickets - 1).length;
}

export function formatActivityNumber(numericValue: number, totalTickets: number) {
  if (!Number.isInteger(numericValue) || numericValue < 0 || numericValue >= totalTickets) {
    throw new Error("El número de rifa está fuera del rango permitido.");
  }

  return String(numericValue).padStart(getActivityNumberWidth(totalTickets), "0");
}

export function normalizeActivityNumberInput(value: string | number, totalTickets: number) {
  const rawValue = String(value).trim();

  if (!/^\d+$/.test(rawValue)) {
    throw new Error("Los números de rifa solo pueden contener dígitos.");
  }

  return formatActivityNumber(Number(rawValue), totalTickets);
}

export interface IActivityNumber {
  raffle: mongoose.Types.ObjectId;
  number: string;
  numericValue: number;
  status: ActivityNumberStatus;
  user?: mongoose.Types.ObjectId;
  ticket?: mongoose.Types.ObjectId;
  reservedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivityNumberDocument extends IActivityNumber, Document {}

export interface IActivityNumberModel extends Model<IActivityNumberDocument> {
  generateForActivity(
    activityId: mongoose.Types.ObjectId,
    totalTickets: number,
  ): Promise<IActivityNumberDocument[]>;
  findAvailableByActivity(
    activityId: mongoose.Types.ObjectId,
  ): Promise<IActivityNumberDocument[]>;
}

const activityNumberSchema = new Schema<IActivityNumberDocument, IActivityNumberModel>(
  {
    raffle: {
      type: Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
    },
    number: {
      type: String,
      required: true,
    },
    numericValue: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(ActivityNumberStatus),
      default: ActivityNumberStatus.AVAILABLE,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    ticket: {
      type: Schema.Types.ObjectId,
      ref: "ActivityTicket",
    },
    reservedAt: Date,
    paidAt: Date,
  },
  { timestamps: true },
);

activityNumberSchema.index({ raffle: 1, number: 1 }, { unique: true });
activityNumberSchema.index({ raffle: 1, numericValue: 1 }, { unique: true });
activityNumberSchema.index({ raffle: 1, status: 1, numericValue: 1 });

activityNumberSchema.statics.generateForActivity = async function (
  activityId: mongoose.Types.ObjectId,
  totalTickets: number,
): Promise<IActivityNumberDocument[]> {
  const existingCount = await this.countDocuments({ raffle: activityId });
  if (existingCount > 0) {
    return this.find({ raffle: activityId }).sort({ numericValue: 1 });
  }

  const docs = Array.from({ length: totalTickets }, (_value, numericValue) => ({
    raffle: activityId,
    number: formatActivityNumber(numericValue, totalTickets),
    numericValue,
    status: ActivityNumberStatus.AVAILABLE,
  }));

  await this.insertMany(docs, { ordered: true });

  return this.find({ raffle: activityId }).sort({ numericValue: 1 });
};

activityNumberSchema.statics.findAvailableByActivity = function (
  activityId: mongoose.Types.ObjectId,
): Promise<IActivityNumberDocument[]> {
  return this.find({
    raffle: activityId,
    status: ActivityNumberStatus.AVAILABLE,
  }).sort({ numericValue: 1 });
};

const ActivityNumber = mongoose.model<IActivityNumberDocument, IActivityNumberModel>("ActivityNumber", activityNumberSchema);

export default ActivityNumber;