const express = require('express');
const router = express.Router();
const { sendEmail,sendEmailArcis } = require('../controllers/emailController');

router.post('/send-email', sendEmail);
router.post('/send-email-arcis', sendEmailArcis);

module.exports = router;