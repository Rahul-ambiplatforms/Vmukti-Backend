const multer = require('multer');

// Use memory storage so files are NOT persisted to disk
const storage = multer.memoryStorage();

// Accept only common resume document types
const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF/DOC/DOCX files are allowed for resume upload.'), false);
  }
};

const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

module.exports = uploadResume;


