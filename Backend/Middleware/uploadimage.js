const multer = require('multer');
const cloudinary = require('../config/cloudinary');

const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, WEBP, and GIF images are allowed'));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_IMAGES
  }
}).fields([
  { name: 'featuredImages', maxCount: MAX_IMAGES },
  { name: 'featuredImage', maxCount: 1 }
]);

const uploadArticleImage = (req, res, next) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const files = [
        ...(req.files?.featuredImages || []),
        ...(req.files?.featuredImage || [])
      ];

      if (files.length > MAX_IMAGES) {
        return res.status(400).json({ error: `You can upload up to ${MAX_IMAGES} images` });
      }

      if (files.length) {
        const uploadedImages = [];

        for (const file of files) {
          // Use buffer-based upload to Cloudinary directly (no disk write)
          await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: 'articlehub/articles',
                resource_type: 'image'
              },
              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  uploadedImages.push(result.secure_url);
                  resolve();
                }
              }
            );
            stream.end(file.buffer);
          });
        }

        req.body.images = uploadedImages;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

module.exports = uploadArticleImage;
