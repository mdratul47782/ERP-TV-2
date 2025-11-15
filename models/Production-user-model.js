import mongoose, { Schema } from "mongoose";

const schema = new Schema({
  Production_user_name: { type: String, required: true },
  password: { type: String, required: true },

  phone: {
    required: true,
    type: String,
  },
  bio: {
    required: true,
    type: String,
  },
});

export const ProductionUserModel =
  mongoose.models.ProductionUsers ?? mongoose.model("ProductionUsers", schema);
