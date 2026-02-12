import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    filename: {
      type: String,
      required: true,
    },

    originalName: {
      type: String,
    },

    mimetype: {
      type: String,
    },

    size: {
      type: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Media", mediaSchema);
