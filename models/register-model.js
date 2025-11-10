import mongoose, { Schema } from "mongoose";

const registerSchema = new Schema(
  {
    buyer: { type: String, required: true },
    building: { type: String, required: true },
    floor: { type: String, required: true },
    line: { type: String, required: true },
    created_by: { type: String, required: true }, // ✅ must exist
  },
  { timestamps: true }
);

export const RegisterModel =
  mongoose.models.RegisterModel ||
  mongoose.model("RegisterModel", registerSchema);
