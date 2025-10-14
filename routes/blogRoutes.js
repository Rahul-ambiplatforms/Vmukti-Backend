const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const upload = require("../utils/fileUpload");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

console.log(
  "[ROUTES] blogRoutes.js: Initializing upload.fields for mainImage and imageVideo"
);
const uploadFields = upload.fields([
  { name: "mainImage", maxCount: 1 },
  { name: "imageVideo", maxCount: 10 },
]);

// Blog routes
router.post(
  "/",
  protect,
  authorizeRoles("MARKETING", "ADMIN"),
  (req, res, next) => {
    console.log("[ROUTES] POST /blogs - Incoming request");
    next();
  },
  uploadFields,
  (req, res, next) => {
    console.log("[ROUTES] POST /blogs - Files after upload:", req.files);
    next();
  },
  blogController.createBlog
);

router.get(
  "/",
  (req, res, next) => {
    console.log("[ROUTES] GET /blogs - Incoming request");
    next();
  },
  blogController.getBlogs
);

router.get(
  "/getFiles",
  (req, res, next) => {
    console.log("[ROUTES] GET /blogs - Incoming request");
    next();
  },
  blogController.getImages
);

router.get(
  "/:id",
  (req, res, next) => {
    console.log(
      "[ROUTES] GET /blogs/:id - Incoming request for ID:",
      req.params.id
    );
    next();
  },
  blogController.getBlog
);

router.get("/urlWords/:words", blogController.getBlogByUrlWords);

router.put(
  "/:id",
  protect,
  authorizeRoles("MARKETING", "ADMIN"),
  (req, res, next) => {
    console.log(
      "[ROUTES] PUT /blogs/:id - Incoming request for ID:",
      req.params.id
    );
    next();
  },
  uploadFields,
  (req, res, next) => {
    console.log("[ROUTES] PUT /blogs/:id - Files after upload:", req.files);
    next();
  },
  blogController.updateBlog
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("MARKETING", "ADMIN"),
  (req, res, next) => {
    console.log(
      "[ROUTES] DELETE /blogs/:id - Incoming request for ID:",
      req.params.id
    );
    next();
  },
  blogController.deleteBlog
);

router.patch(
  "/:id/status",
  protect,
  authorizeRoles("MARKETING", "ADMIN"),
  (req, res, next) => {
    console.log(
      "[ROUTES] PATCH /blogs/:id/status - Incoming request for ID:",
      req.params.id,
      "Body:",
      req.body
    );
    next();
  },
  blogController.updateBlogStatus
);

module.exports = router;
