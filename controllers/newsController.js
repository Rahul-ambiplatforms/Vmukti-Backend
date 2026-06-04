const { newsModel } = require("../models/factory");

function slugify(str = "") {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Create news article
exports.createNews = async (req, res) => {
  try {
    const News = newsModel(req.tenant);
    const body = req.body || {};

    const urlWords = (body.urlWords && body.urlWords.trim()) || slugify(body.title || "");
    if (!body.title || !urlWords) {
      return res.status(400).json({
        status: "error",
        message: "Title and URL slug are required",
      });
    }

    const conflict = await News.findOne({ urlWords });
    if (conflict) {
      return res.status(400).json({
        status: "error",
        message: `URL slug "${urlWords}" already exists`,
      });
    }

    const doc = await News.create({
      title: body.title,
      urlWords,
      category: body.category || "General",
      image: body.image || "",
      brief: body.brief || "",
      content: body.content || "",
      status: body.status || "published",
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
    });

    return res.status(201).json({ status: "success", data: doc });
  } catch (error) {
    console.error("News creation error:", error);
    return res.status(400).json({ status: "error", message: error.message });
  }
};

// List news with filters (year, category, status, search) + pagination
exports.getNewsList = async (req, res) => {
  try {
    const News = newsModel(req.tenant);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(60, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const status = req.query.status;
    const year = req.query.year;
    const category = req.query.category;
    const search = req.query.search;

    const match = {};
    if (status && status !== "all" && ["draft", "published", "archived"].includes(status)) {
      match.status = status;
    }
    if (category && category !== "all") {
      match.category = new RegExp(`^${escapeRegex(category)}$`, "i");
    }
    if (search) {
      match.title = new RegExp(escapeRegex(search), "i");
    }
    if (year && year !== "all") {
      const y = Number(year);
      if (!Number.isNaN(y)) {
        match.publishedAt = {
          $gte: new Date(Date.UTC(y, 0, 1)),
          $lt: new Date(Date.UTC(y + 1, 0, 1)),
        };
      }
    }

    const [items, total, years, categories] = await Promise.all([
      News.find(match).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      News.countDocuments(match),
      News.aggregate([
        { $match: { status: "published" } },
        { $group: { _id: { $year: "$publishedAt" } } },
        { $sort: { _id: -1 } },
      ]),
      News.distinct("category", { status: "published" }),
    ]);

    return res.status(200).json({
      status: "success",
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      filters: {
        years: years.map((y) => y._id).filter((y) => typeof y === "number"),
        categories: (categories || []).filter(Boolean).sort(),
      },
    });
  } catch (error) {
    console.error("News list error:", error);
    return res.status(400).json({ status: "error", message: error.message });
  }
};

// Get news by Mongo _id
exports.getNewsById = async (req, res) => {
  try {
    const News = newsModel(req.tenant);
    const doc = await News.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ status: "error", message: "News not found" });
    }
    return res.status(200).json({ status: "success", data: doc });
  } catch (error) {
    return res.status(400).json({ status: "error", message: error.message });
  }
};

// Get news by URL slug (public detail page lookup)
exports.getNewsByUrlWords = async (req, res) => {
  try {
    const News = newsModel(req.tenant);
    const doc = await News.findOne({ urlWords: req.params.words });
    if (!doc) {
      return res.status(404).json({ status: "error", message: "News not found" });
    }
    return res.status(200).json({ status: "success", data: doc });
  } catch (error) {
    return res.status(400).json({ status: "error", message: error.message });
  }
};

// Update news
exports.updateNews = async (req, res) => {
  try {
    const News = newsModel(req.tenant);
    const body = req.body || {};

    const existing = await News.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ status: "error", message: "News not found" });
    }

    const nextSlug = (body.urlWords && body.urlWords.trim()) || existing.urlWords;
    if (nextSlug !== existing.urlWords) {
      const conflict = await News.findOne({ urlWords: nextSlug });
      if (conflict) {
        return res.status(400).json({
          status: "error",
          message: `URL slug "${nextSlug}" already exists`,
        });
      }
    }

    const updates = {
      title: body.title ?? existing.title,
      urlWords: nextSlug,
      category: body.category ?? existing.category,
      image: body.image ?? existing.image,
      brief: body.brief ?? existing.brief,
      content: body.content ?? existing.content,
      status: body.status ?? existing.status,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : existing.publishedAt,
    };

    const doc = await News.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    return res.status(200).json({ status: "success", data: doc });
  } catch (error) {
    console.error("News update error:", error);
    return res.status(400).json({ status: "error", message: error.message });
  }
};

// Delete news
exports.deleteNews = async (req, res) => {
  try {
    const News = newsModel(req.tenant);
    const doc = await News.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ status: "error", message: "News not found" });
    }
    return res.status(200).json({ status: "success", message: "News deleted successfully" });
  } catch (error) {
    return res.status(400).json({ status: "error", message: error.message });
  }
};

// Update news status only
exports.updateNewsStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!["draft", "published", "archived"].includes(status)) {
      return res.status(400).json({ status: "error", message: "Invalid status value" });
    }
    const News = newsModel(req.tenant);
    const doc = await News.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!doc) {
      return res.status(404).json({ status: "error", message: "News not found" });
    }
    return res.status(200).json({ status: "success", data: doc });
  } catch (error) {
    return res.status(400).json({ status: "error", message: error.message });
  }
};
