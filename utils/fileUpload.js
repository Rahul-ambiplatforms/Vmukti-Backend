const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('[MULTER] Destination called for field:', file.fieldname, 'Original name:', file.originalname);
    const dest = req.tenant === 'arcis' ? 'upload_arcis/' : 'uploads/';
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('[MULTER] Filename generated for field:', file.fieldname, '->', filename);
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  console.log('[MULTER] File filter called for:', file.originalname, 'Mimetype:', file.mimetype);
  // Accept images and videos only
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    console.warn('[MULTER] File rejected (not image/video):', file.originalname);
    cb(new Error('Not an image or video! Please upload only images or videos.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

console.log('[MULTER] Multer upload middleware initialized.');

module.exports = upload;