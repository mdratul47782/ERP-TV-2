// models/production-input-model.js
import mongoose, { Schema } from "mongoose";

const productionInputSchema = new Schema(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user_name: {
      type: String,
      required: true,
    },
    building: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: String,
      required: true,
      trim: true,
    },
    line: {
      type: String,
      required: true,
      trim: true,
    },
    buyer: {
      type: String,
      required: true,
      trim: true,
    },
    style: {
      type: String,
      required: true,
      trim: true,
    },
    item: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ProductionInputModel =
  mongoose.models.ProductionInput ||
  mongoose.model("ProductionInput", productionInputSchema);