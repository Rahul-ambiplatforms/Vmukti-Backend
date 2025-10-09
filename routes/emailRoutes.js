const express = require("express");
const router = express.Router();
const {
  sendEmail,
  sendEmailArcis,
  sendCareerEmail,
} = require("../controllers/emailController");
const uploadResume = require("../utils/resumeUpload");

router.post("/send-email", sendEmail);
router.post("/send-email-arcis", sendEmailArcis);
router.post(
  "/send-email-carrer",
  uploadResume.single("resume"),
  sendCareerEmail
);

module.exports = router;
