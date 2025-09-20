const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

// File upload route
router.post('/upload', (req, res, next) => {
  console.log('[ROUTES] POST /files/upload - Incoming file upload request');
  next();
}, fileController.uploadFile);

// File delete route
router.delete('/:filename', (req, res, next) => {
  console.log('[ROUTES] DELETE /files/:filename - Incoming file delete request for:', req.params.filename);
  next();
}, fileController.deleteFile);

module.exports = router; 