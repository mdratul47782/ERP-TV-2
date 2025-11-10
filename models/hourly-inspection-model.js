// models/hourly-inspection-model.js
import mongoose, { Schema } from "mongoose";

const DefectItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const HourlyInspectionSchema = new Schema(
  {
    user: {
      id: { type: Schema.Types.ObjectId, ref: "User", required: true },
      user_name: { type: String, required: true, trim: true },
    },

    // দিনের শুরু সময় (local date only)
    reportDate: {
      type: Date,
      required: true,
      default: () => new Date(new Date().toDateString()),
    },

    // "1st Hour" ... etc
    hourLabel: { type: String, required: true, trim: true },
    hourIndex: { type: Number, required: true, min: 1, max: 24 },

    inspectedQty: { type: Number, required: true, min: 0, default: 0 },
    passedQty: { type: Number, required: true, min: 0, default: 0 },
    defectivePcs: { type: Number, required: true, min: 0, default: 0 },
    afterRepair: { type: Number, required: true, min: 0, default: 0 },

    totalDefects: { type: Number, required: true, min: 0, default: 0 },
    selectedDefects: { type: [DefectItemSchema], default: [] },

    // (ঐচ্ছিক) লাইন ইনফো
    lineInfo: {
      buyer: { type: String, trim: true },
      building: { type: String, trim: true },
      floor: { type: String, trim: true },
      line: { type: String, trim: true },
      registerId: { type: Schema.Types.ObjectId, ref: "Register" },
    },
  },
  { timestamps: true, collection: "endline_hour_entries" }
);

// একই user + date + hourIndex এ ডুপ্লিকেট ব্লক
HourlyInspectionSchema.index(
  { "user.id": 1, reportDate: 1, hourIndex: 1 },
  { unique: true }
);

// সার্ভার সাইড কম্পিউট/নরমালাইজ
HourlyInspectionSchema.pre("validate", function (next) {
  if (Array.isArray(this.selectedDefects)) {
    this.totalDefects = this.selectedDefects.reduce(
      (acc, d) => acc + (Number(d.quantity) || 0),
      0
    );
  } else {
    this.selectedDefects = [];
    this.totalDefects = 0;
  }

  if (!this.hourIndex && this.hourLabel) {
    const m = this.hourLabel.match(/^(\d+)/);
    if (m) this.hourIndex = parseInt(m[1], 10);
  }

  next();
});

export const HourlyInspectionModel =
  mongoose.models.HourlyInspection ||
  mongoose.model("HourlyInspection", HourlyInspectionSchema);
