const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const FileType = require('file-type');

// Memory storage to access buffer for validation
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Strict allowed types
  const allowedExtensions = ['.jpeg', '.jpg', '.png', '.webp'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WEBP images are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const validateMagicNumber = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const type = await FileType.fromBuffer(req.file.buffer);
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!type || !allowedMimeTypes.includes(type.mime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file content! Only JPEG, PNG, and WEBP are allowed.'
      });
    }

    // Manual save to disk to ensure controller compatibility
    const UPLOAD_PATH = process.env.UPLOAD_PATH;
    if (!UPLOAD_PATH) {
      return next(new Error('UPLOAD_PATH not defined in .env'));
    }
    const uploadDir = path.resolve(UPLOAD_PATH);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname).toLowerCase() || `.${type.ext}`;
    const filename = `${uuidv4()}${ext}`;
    const fullPath = path.join(uploadDir, filename);

    fs.writeFileSync(fullPath, req.file.buffer);
    
    // Set properties for backward compatibility with controllers
    req.file.filename = filename;
    req.file.path = fullPath;
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, validateMagicNumber };

