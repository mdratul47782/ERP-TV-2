// models/ProductionHeader-model.js
import mongoose, { Schema, models, model } from "mongoose";

// 🔹 We'll store snapshots of both users (no password)
const EmbeddedUserSchema = new Schema(
  {
    id: { type: String, required: true },
    user_name: { type: String }, // for quality user
    Production_user_name: { type: String }, // for production user
    phone: { type: String },
    bio: { type: String },
  },
  { _id: false }
);

const ProductionHeaderSchema = new Schema(
  {
    // 🔹 One record per production user per day
    productionDate: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },

    // 🔹 All fields optional – user may leave blank
    operatorTo: { type: Number },
    manpowerPresent: { type: Number },
    manpowerAbsent: { type: Number },
    workingHour: { type: Number },
    planQuantity: { type: Number },
    planEfficiency: { type: Number },
    smv: { type: Number }, // ✅ NEW
    todayTarget: { type: Number },
    achieve: { type: Number },

    // 🔹 Production user snapshot
    productionUser: {
      type: EmbeddedUserSchema,
      required: true,
    },

    // 🔹 Quality user snapshot (optional)
    qualityUser: {
      type: EmbeddedUserSchema,
      required: false,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// 🔹 Unique per production user + date
ProductionHeaderSchema.index(
  { "productionUser.id": 1, productionDate: 1 },
  { unique: true }
);

export const ProductionHeaderModel =
  models.ProductionHeader || model("ProductionHeader", ProductionHeaderSchema);
