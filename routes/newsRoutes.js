const express = require("express");
const router = express.Router();
const newsController = require("../controllers/newsController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

// Public reads
router.get("/", newsController.getNewsList);
router.get("/urlWords/:words", newsController.getNewsByUrlWords);
router.get("/:id", newsController.getNewsById);

// Authenticated writes — Marketing + Admin only, same policy as blogs
router.post("/", protect, authorizeRoles("MARKETING", "ADMIN"), newsController.createNews);
router.put("/:id", protect, authorizeRoles("MARKETING", "ADMIN"), newsController.updateNews);
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("MARKETING", "ADMIN"),
  newsController.updateNewsStatus
);
router.delete("/:id", protect, authorizeRoles("MARKETING", "ADMIN"), newsController.deleteNews);

module.exports = router;
