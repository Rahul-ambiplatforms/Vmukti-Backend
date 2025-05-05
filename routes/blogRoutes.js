const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const upload = require('../utils/fileUpload');

// Configure multer for multiple file uploads
const uploadFields = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'imageVideo', maxCount: 10 } // Allow multiple image/video uploads for content
]);

// Blog routes
router.post('/', uploadFields, blogController.createBlog);
router.get('/', blogController.getBlogs);
router.get('/:id', blogController.getBlog);
router.put('/:id', uploadFields, blogController.updateBlog);
router.delete('/:id', blogController.deleteBlog);
router.patch('/:id/status', blogController.updateBlogStatus);

module.exports = router; 