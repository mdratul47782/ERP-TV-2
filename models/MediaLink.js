import mongoose from "mongoose";

const mediaLinkSchema = new mongoose.Schema(
  {
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      user_name: { type: String, required: true },
    },
    imageSrc: { type: String, default: "" },
    videoSrc: { type: String, default: "" },
  },
  { timestamps: true }
);

// Compound index to ensure one record per user
mediaLinkSchema.index({ "user.id": 1 }, { unique: true });

export default mongoose.models.MediaLink || mongoose.model("MediaLink", mediaLinkSchema);
