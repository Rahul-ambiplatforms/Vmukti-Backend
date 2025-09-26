// backend/controllers/blogController.js

const Blog = require("../models/Blog");

const fs = require("fs");
const path = require("path");

exports.getImages = (req, res) => {
  const uploadsDir = path.join(__dirname, "../uploads");

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error("Error reading uploads directory:", err);
      return res.status(500).json({ error: "Failed to read uploads folder" });
    }

    // Filter only image files if needed
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    res.json({ files: imageFiles });
  });
};
// Create a new blog
exports.createBlog = async (req, res) => {
  try {
    console.log("Request content type:", req.get("Content-Type"));
    // console.log("Request body:", req.body);

    let blogData;

    // Handle both JSON and FormData submissions
    if (req.is("multipart/form-data")) {
      console.log("Processing as multipart/form-data");
      if (!req.body.formattedData) {
        console.log("Missing formattedData in form data");
        return res.status(400).json({
          status: "error",
          message: "formattedData is required for multipart/form-data",
        });
      }
      try {
        blogData = JSON.parse(req.body.formattedData);
        console.log("Parsed formattedData:", blogData);
      } catch (parseError) {
        console.error("Error parsing formattedData:", parseError);
        return res.status(400).json({
          status: "error",
          message: "Invalid JSON format in formattedData",
          details: parseError.message,
        });
      }

      // Handle file uploads if present
      if (req.files) {
        // Handle main image
        if (req.files.mainImage) {
          console.log(
            "[CONTROLLER] mainImage file(s) received:",
            req.files.mainImage.map((f) => f.originalname)
          );
          blogData.content.mainImage = `${req.files.mainImage[0].filename}`;
          console.log(
            "[CONTROLLER] mainImage URL set to:",
            blogData.content.mainImage
          );
        } else {
          console.log("[CONTROLLER] No mainImage file received.");
        }

        // Handle imageVideo files
        if (req.files.imageVideo && blogData.content.headingsAndImages) {
          const imageFiles = req.files.imageVideo;
          console.log(
            "[CONTROLLER] imageVideo file(s) received:",
            imageFiles.map((f) => f.originalname)
          );

          // Store all imageVideo filenames in the imageVideos array
          blogData.content.imageVideos = imageFiles.map(
            (file) => file.filename
          );
          console.log(
            "[CONTROLLER] imageVideos array:",
            blogData.content.imageVideos
          );

          blogData.content.headingsAndImages =
            blogData.content.headingsAndImages.map((item) => {
              if (
                item.type === "imageVideo" &&
                typeof item.content.imageIndex === "number"
              ) {
                const file = imageFiles[item.content.imageIndex];
                if (file) {
                  return {
                    ...item,
                    content: {
                      description: item.content.description || "",
                      imagePath: file.filename,
                      imageIndex: null,
                    },
                  };
                }
              }
              return item;
            });
        } else if (req.files.imageVideo) {
          console.log(
            "[CONTROLLER] imageVideo files received but no headingsAndImages to assign."
          );
          // Still store the filenames even if there are no headingsAndImages
          blogData.content.imageVideos = req.files.imageVideo.map(
            (file) => file.filename
          );
        } else {
          console.log("[CONTROLLER] No imageVideo files received.");
        }
      } else {
        console.log("[CONTROLLER] No files received in request.");
      }
    } else {
      console.log("Processing as direct JSON");
      blogData = req.body;
    }

    if (blogData) {
      console.log("Resolved Author:", blogData.content);
      const resolvedAuthor = blogData?.content?.blogAuthor;
      if (resolvedAuthor) {
        blogData.content.blogAuthor = resolvedAuthor;
      }
    }

    // Log the final data before validation
    console.log("Final blog data:", blogData);
    console.log("Has metadata:", !!blogData?.metadata);
    console.log("Has content:", !!blogData?.content);

    // Validate required fields
    if (!blogData?.metadata || !blogData?.content) {
      console.log("Validation failed - missing fields");
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: metadata and content",
      });
    }

    // Create and save the blog
    const blog = new Blog(blogData);
    await blog.save();

    res.status(201).json({
      status: "success",
      data: blog,
    });
  } catch (error) {
    console.error("Blog creation error:", error);
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get all blogs with pagination, searching, and sorting
exports.getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    // Get search and sort parameters from query
    const searchTerm = req.query.search || "";
    const sortOrder = req.query.sort || "latest"; 
    const status = req.query.status; // optional: 'draft' | 'published' | 'archived'

    console.log("Search Term:", searchTerm);
    console.log("Sort Order:", sortOrder);
    // --- Aggregation Pipeline ---

    // 1. Match Stage: Filter documents based on the search term (case-insensitive)
    const matchStage = {};
    if (searchTerm) {
      matchStage["content.title"] = { $regex: searchTerm, $options: "i" };
    }
    if (status && ["draft", "published", "archived"].includes(status)) {
      matchStage["status"] = status;
    }

    // 2. AddFields Stage: Create a new field latestDate to sort on.
    // This field will be the later of updatedAt or createdAt.
    const addFieldsStage = {
      $addFields: {
        latestDate: { $max: ["$createdAt", "$updatedAt"] },
      },
    };

    // 3. Sort Stage: Sort by the newly created latestDate field
    const sortStage = {
      $sort: {
        latestDate: sortOrder === "latest" ? -1 : 1, // -1 for descending, 1 for ascending
      },
    };

    // --- Execute two queries: one for total count and one for paginated data ---

    // Query for getting the total number of filtered documents
    const totalPipeline = [
      addFieldsStage,
      { $match: matchStage },
      { $count: "total" },
    ];
    const totalResult = await Blog.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Query for getting the paginated data
    const dataPipeline = [
      addFieldsStage,
      { $match: matchStage },
      sortStage,
      { $skip: skip },
      { $limit: limit },
    ];
    const blogs = await Blog.aggregate(dataPipeline);

    res.status(200).json({
      status: "success",
      data: blogs,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get a single blog by ID
exports.getBlog = async (req, res) => {
  // Your existing getBlog code here
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        status: "error",
        message: "Blog not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: blog,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getBlogByUrlWords = async (req, res) => {
  // Your existing getBlog code here
  console.log("req.params.words", req.params.words);
  try {
    const blog = await Blog.findOne({ "metadata.urlWords": req.params.words });
    if (!blog) {
      return res.status(404).json({
        status: "error",
        message: "Blog not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: blog,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.updateBlog = async (req, res) => {
  // Your existing updateBlog code here
  try {
    let blogData;

    // Handle both JSON and FormData submissions
    if (req.is("multipart/form-data")) {
      blogData = JSON.parse(req.body.formattedData);
      console.log("blogdata while updating :", blogData);
      // Handle file uploads if present
      if (req.files) {
        if (req.files.mainImage) {
          blogData.content.mainImage = `${req.files.mainImage[0].filename}`;
        }

        // Handle imageVideo files
        if (req.files.imageVideo && blogData.content.headingsAndImages) {
          const imageFiles = req.files.imageVideo;
          console.log(
            "[CONTROLLER] imageVideo file(s) received:",
            imageFiles.map((f) => f.originalname)
          );

          // Store all imageVideo filenames in the imageVideos array
          blogData.content.imageVideos = imageFiles.map(
            (file) => file.filename
          );
          console.log(
            "[CONTROLLER] imageVideos array:",
            blogData.content.imageVideos
          );

          // Update the headingsAndImages with file paths in the correct sequence
          blogData.content.headingsAndImages =
            blogData.content.headingsAndImages.map((item) => {
              if (
                item.type === "imageVideo" &&
                typeof item.content.imageIndex === "number"
              ) {
                const file = imageFiles[item.content.imageIndex];
                if (file) {
                  return {
                    ...item,
                    content: {
                      description: item.content.description || "",
                      imagePath: file.filename,
                      imageIndex: null,
                    },
                  };
                }
              }
              return item;
            });
        }
      }
    } else {
      // Direct JSON submission
      blogData = req.body;
    }

    // Normalize author fields: ensure required top-level author is set
    if (blogData) {
      console.log("Resolved Author:", blogData);
      const resolvedAuthor = blogData.content.blogAuthor;
      if (resolvedAuthor) {
        blogData.content.blogAuthor = resolvedAuthor;
        // blogData.author = resolvedAuthor;
      }
    }

    const blog = await Blog.findByIdAndUpdate(req.params.id, blogData, {
      new: true,
      runValidators: true,
    });

    if (!blog) {
      return res.status(404).json({
        status: "error",
        message: "Blog not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: blog,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.deleteBlog = async (req, res) => {
  // Your existing deleteBlog code here
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({
        status: "error",
        message: "Blog not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Blog deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.updateBlogStatus = async (req, res) => {
  // Your existing updateBlogStatus code here
  try {
    const { status } = req.body;

    if (!["draft", "published", "archived"].includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid status value",
      });
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!blog) {
      return res.status(404).json({
        status: "error",
        message: "Blog not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: blog,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
