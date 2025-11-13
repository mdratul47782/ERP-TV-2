import mongoose from "mongoose";

const registerSchema = new mongoose.Schema(
  {
    buyer: { type: String, required: true },
    building: { type: String, required: true },
    floor: { type: String, required: true },
    line: { type: String, required: true },
    style: { type: String, required: true },
    item: { type: String, required: true },
    color: { type: String, required: true },

    // 🔹 New fields
    smv: { type: String, required: true },
    runDay: { type: String, required: true },

    created_by: { type: String, required: true },
  },
  { timestamps: true }
);

export const RegisterModel =
  mongoose.models.Register || mongoose.model("Register", registerSchema);
