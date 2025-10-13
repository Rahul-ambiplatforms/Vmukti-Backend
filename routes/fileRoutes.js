const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

// File upload route
router.post('/upload', (req, res, next) => {
  console.log('[ROUTES] POST /files/upload - Incoming file upload request');
  next();
}, fileController.uploadFile);

// Upload JD PDF (<=5MB) to Cloudinary JD_vmukti
router.post('/upload-jd', (req, res, next) => {
  console.log('[ROUTES] POST /files/upload-jd - Incoming JD upload request');
  next();
}, fileController.uploadJD);

// Inspect JD asset
router.get('/jd-info/:filename', fileController.getJDInfo);

// Delete JD asset
router.delete('/jd/:filename', fileController.deleteJD);

// File delete route
router.delete('/:filename', (req, res, next) => {
  console.log('[ROUTES] DELETE /files/:filename - Incoming file delete request for:', req.params.filename);
  next();
}, fileController.deleteFile);

module.exports = router; 