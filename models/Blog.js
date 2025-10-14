const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    metadata: {
      urlWords: { type: String, required: true },
      metaTitle: { type: String, required: true },
      metaDescription: { type: String, required: true },
    },
    content: {
      title: { type: String, required: true },
      blogAuthor: { type: String, required: true },
      imageText: { type: String },
      mainImage: { type: String },
      imageVideos: [{ type: String }],
      brief: { type: mongoose.Schema.Types.Mixed, required: true },

      // Dynamic content array that can hold different types of content
      headingsAndImages: [
        {
          id: { type: String, required: true },
          type: {
            type: String,
            required: true,
            enum: ["h2", "h3", "h4", "p", "imageVideo", "cta"],
          },
          content: { type: mongoose.Schema.Types.Mixed, required: true },
        },
      ],

      // FAQ section with structured question-answer pairs
      faqs: {
        title: String,
        items: [
          {
            id: { type: String, required: true },
            question: { type: String, required: true },
            answer: { type: mongoose.Schema.Types.Mixed, required: true }, // Slate editor content
          },
        ],
      },

      // Store raw JSON schema as is
      schemas: [
        {
          id: { type: String, required: true },
          content: { type: mongoose.Schema.Types.Mixed, required: true },
        },
      ],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

// Validate content.headingsAndImages
blogSchema.path("content.headingsAndImages").validate(function (items) {
  if (!Array.isArray(items)) return false;

  return items.every((item) => {
    switch (item.type) {
      case "h2":
      case "h3":
      case "h4":
      case "p":
        return item.content.text;
      case "imageVideo":
        return (
          item.content.description &&
          (typeof item.content.imageIndex === "number" ||
            item.content.imagePath)
        );
      case "cta":
        return (
          item.content.ctaText &&
          item.content.buttonText &&
          item.content.buttonLink
        );
      default:
        return false;
    }
  });
}, "Invalid content in headingsAndImages array");

module.exports = mongoose.model("Blog", blogSchema);
