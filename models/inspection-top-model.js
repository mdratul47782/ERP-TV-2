// models/inspection-top-model.js
import mongoose, { Schema } from "mongoose";

const InspectionTopSchema = new Schema(
  {
    user: {
      id: { type: Schema.Types.ObjectId, ref: "User", required: true },
      user_name: { type: String, required: true, trim: true },
    },
    // আজকের দিনের শুরু (local date only)
    reportDate: {
      type: Date,
      required: true,
      default: () => new Date(new Date().toDateString()),
    },

    building: { type: String, trim: true, default: "" },
    floor: { type: String, trim: true, default: "" },
    line: { type: String, trim: true, default: "" },
    buyer: { type: String, trim: true, default: "" },
    style: { type: String, trim: true, default: "" },
    item: { type: String, trim: true, default: "" },
    color: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "inspection_top_inputs" }
);

// একই ইউজার + একই দিন + একই লাইন => একটি রেকর্ড
InspectionTopSchema.index(
  { "user.id": 1, reportDate: 1, line: 1 },
  { unique: true }
);

export const InspectionTopModel =
  mongoose.models.InspectionTop ||
  mongoose.model("InspectionTop", InspectionTopSchema);
