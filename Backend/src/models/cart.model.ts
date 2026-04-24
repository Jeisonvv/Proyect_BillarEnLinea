import mongoose, { Document, Schema } from "mongoose";
import { Channel } from "./enums.js";

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  variantSku?: string;
  addedAt: Date;
}

export interface ICart {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  channel: Channel;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartDocument extends ICart, Document {}

const cartItemSchema = new Schema<ICartItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    variantSku: String,
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const cartSchema = new Schema<ICartDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    channel: {
      type: String,
      enum: Object.values(Channel),
      default: Channel.WEB,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

cartSchema.index({ user: 1 }, { unique: true });
cartSchema.index({ updatedAt: -1 });

const Cart = mongoose.model<ICartDocument>("Cart", cartSchema);

export default Cart;