const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    urlWords: { type: String, required: true, trim: true, index: true },
    category: { type: String, default: "General", trim: true },
    image: { type: String, default: "" },
    brief: { type: String, default: "" },
    content: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true,
    },
    publishedAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
  }
);

newsSchema.index({ status: 1, publishedAt: -1 });

module.exports = mongoose.model("News", newsSchema);
