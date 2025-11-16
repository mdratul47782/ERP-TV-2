// models/ProductionHeader-model.js
import mongoose from "mongoose";

const ProductionUserSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    Production_user_name: String,
    phone: String,
    bio: String,
  },
  { _id: false }
);

const QualityUserSchema = new mongoose.Schema(
  {
    id: String,
    user_name: String,
    phone: String,
    bio: String,
  },
  { _id: false }
);

const ProductionHeaderSchema = new mongoose.Schema(
  {
    // 🔹 YYYY-MM-DD in the end-user's local timezone
    headerDate: { type: String, required: true },

    // 🔹 Who this header belongs to (snapshot, no secrets)
    productionUser: { type: ProductionUserSchema, required: true },
    qualityUser: { type: QualityUserSchema },

    // 🔹 Numbers you already collect
    operatorTo: { type: Number, default: 0 },
    manpowerPresent: { type: Number, default: 0 },
    manpowerAbsent: { type: Number, default: 0 },
    workingHour: { type: Number, default: 0 },
    planQuantity: { type: Number, default: 0 },
    planEfficiency: { type: Number, default: 0 },
    todayTarget: { type: Number, default: 0 },
    achieve: { type: Number, default: 0 },
    smv: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 🔹 Enforce one header per day per production user
ProductionHeaderSchema.index(
  { "productionUser.id": 1, headerDate: 1 },
  { unique: true }
);

export const ProductionHeaderModel =
  mongoose.models.ProductionHeader ||
  mongoose.model("ProductionHeader", ProductionHeaderSchema);
