// models/HourlyProduction-model.js
import mongoose, { Schema, models, model } from "mongoose";

// 🔹 Same embedded user structure as ProductionHeader (snapshot of ProductionAuth)
const EmbeddedUserSchema = new Schema(
  {
    id: { type: String, required: true },
    user_name: { type: String }, // for quality user if ever needed
    Production_user_name: { type: String }, // for production user
    phone: { type: String },
    bio: { type: String },
  },
  { _id: false }
);

const HourlyProductionSchema = new Schema(
  {
    // 🔹 Link to header (line/day)
    headerId: {
      type: Schema.Types.ObjectId,
      ref: "ProductionHeader",
      required: true,
    },

    // 🔹 Which hour in the day (1..workingHour)
    hour: {
      type: Number,
      required: true,
      min: 1,
    },

    // 🔹 Snapshot of production user
    productionUser: {
      type: EmbeddedUserSchema,
      required: true,
    },

    // 🔹 Basic numeric data
    achievedQty: { type: Number, required: true }, // output this hour

    // 🔹 Targets & variance
    baseTargetPerHour: { type: Number, required: true }, // base hourly target at plan efficiency
    dynamicTarget: { type: Number, required: true }, // base + carry-forward shortfall
    varianceQty: { type: Number, required: true }, // dynamicTarget - achievedQty

    // 🔹 Efficiencies
    hourlyEfficiency: { type: Number, required: true }, // this hour
    achieveEfficiency: { type: Number, required: true }, // overall till this hour
    totalEfficiency: { type: Number, required: true }, // same as achieveEfficiency (avg from 1st hour)
  },
  { timestamps: true }
);

// 🔹 One record per header + production user + hour
HourlyProductionSchema.index(
  { headerId: 1, "productionUser.id": 1, hour: 1 },
  { unique: true }
);

export const HourlyProductionModel =
  models.HourlyProduction || model("HourlyProduction", HourlyProductionSchema);
