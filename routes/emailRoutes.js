const express = require("express");
const router = express.Router();
const uploadResume = require("../utils/resumeUpload");

const {
  sendEmail,
  sendEmailArcis,
  sendCareerEmail,
  sendCareerEmailAdiance,
} = require("../controllers/emailController");

router.post("/send-email", sendEmail);
router.post("/send-email-arcis", sendEmailArcis);
router.post(
  "/send-email-career",
  uploadResume.single("resume"),
  sendCareerEmail
);

router.post(
  "/send-email-career-adiance",
  uploadResume.single("resume"),
  sendCareerEmailAdiance
);

module.exports = router;
