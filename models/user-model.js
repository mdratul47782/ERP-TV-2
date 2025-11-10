import mongoose, {Schema} from "mongoose";

const schema = new Schema({
  user_name: { type: String, required: true },
password: { type: String, required: true },

  phone: {
    required: true,
    type: String
  },
  bio: {
    required: true,
    type: String
  }
});


export const userModel = mongoose.models.users ?? mongoose.model("users", schema);