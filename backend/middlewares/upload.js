const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const FileType = require('file-type');

const storage = multer.memoryStorage();

const ALLOWED_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EXTENSION_TO_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ALLOWED_EXTENSIONS.includes(ext) && ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WEBP images are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const validateMagicNumber = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const type = await FileType.fromBuffer(req.file.buffer);

    if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file content! Only JPEG, PNG, and WEBP are allowed.'
      });
    }

    const claimedExt = path.extname(req.file.originalname).toLowerCase();
    const expectedMime = EXTENSION_TO_MIME[claimedExt];

    if (expectedMime && expectedMime !== type.mime) {
      return res.status(400).json({
        success: false,
        message: 'File extension does not match actual file type.'
      });
    }

    const UPLOAD_PATH = process.env.UPLOAD_PATH;
    if (!UPLOAD_PATH) {
      return next(new Error('UPLOAD_PATH not defined in .env'));
    }
    const uploadDir = path.resolve(UPLOAD_PATH);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeExt = `.${type.ext}`;
    const filename = `${uuidv4()}${safeExt}`;
    const fullPath = path.join(uploadDir, filename);

    fs.writeFileSync(fullPath, req.file.buffer);

    req.file.filename = filename;
    req.file.path = fullPath;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, validateMagicNumber };
