const multer = require('multer');

// Set up multer storage configuration
const storage = multer.memoryStorage(); // Store files in memory to be uploaded to S3

// Create the multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF and common image file types
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (JPEG, PNG, GIF, WebP) are allowed!'), false);
    }
  },
});

module.exports = upload;