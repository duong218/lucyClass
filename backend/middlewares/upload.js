const multer = require('multer');
const path = require('path');
const FileType = require('file-type');
const sharp = require('sharp');

const storage = multer.memoryStorage();

const ALLOWED_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MIME_TO_EXTENSION = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

// [SECURITY] Giới hạn kích thước ảnh tối đa sau khi giải nén (chống pixel bomb)
const MAX_IMAGE_DIMENSION = 4096;
const MAX_IMAGE_PIXELS = MAX_IMAGE_DIMENSION * MAX_IMAGE_DIMENSION;

// [SECURITY] Sanitize filename: loại bỏ ký tự nguy hiểm, chỉ giữ ký tự an toàn
const sanitizeFilename = (filename, forcedExtension) => {
  const originalExt = path.extname(filename).toLowerCase();
  const ext = (forcedExtension || originalExt).toLowerCase();
  const base = path.basename(filename, originalExt)
    .replace(/[^a-zA-Z0-9_\-]/g, '_') // chỉ cho phép chữ, số, _ và -
    .slice(0, 64) || 'upload';          // giới hạn độ dài tên file
  return `${base}${ext}`;
};

const fileFilter = (req, file, cb) => {
  // [SECURITY] Sanitize filename ngay khi nhận vào, trước khi xử lý
  file.originalname = sanitizeFilename(file.originalname);

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
    fileSize: 5 * 1024 * 1024,
    files: 1, // [SECURITY] Chỉ cho phép upload 1 file mỗi request
    fields: 20,
    parts: 21,
    fieldNameSize: 100,
    fieldSize: 256 * 1024
  }
});

const validateMagicNumber = async (req, res, next) => {
  if (!req.file) return next();

  try {
    // Lớp 1: Kiểm tra magic bytes (file type thật sự)
    const type = await FileType.fromBuffer(req.file.buffer);

    if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung file không hợp lệ! Chỉ chấp nhận ảnh JPEG, PNG và WEBP.'
      });
    }

    // Auto-correct mimetype theo nội dung thật (ví dụ: file .jpg nhưng thực tế là PNG)
    // Đảm bảo downstream code dùng đúng mime type
    req.file.mimetype = type.mime;
    req.file.originalname = sanitizeFilename(
      req.file.originalname,
      MIME_TO_EXTENSION[type.mime]
    );

    // [SECURITY] Lớp 2: Dùng sharp để:
    //   - Chống pixel bomb (ảnh kích thước khổng lồ sau giải nén)
    //   - Strip toàn bộ metadata EXIF (GPS, comment, thumbnail nhúng...)
    //   - Re-encode lại ảnh, loại bỏ payload ẩn trong chunk/header
    const image = sharp(req.file.buffer, {
      limitInputPixels: MAX_IMAGE_PIXELS
    }).rotate();
    const metadata = await image.metadata();

    if (
      !metadata.width || !metadata.height ||
      metadata.width > MAX_IMAGE_DIMENSION ||
      metadata.height > MAX_IMAGE_DIMENSION
    ) {
      return res.status(400).json({
        success: false,
        message: `Kích thước ảnh không được vượt quá ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION} pixels.`
      });
    }

    // Re-encode ảnh: strip EXIF + đảm bảo output là ảnh sạch
    req.file.buffer = await image
      .toFormat(type.ext === 'jpg' ? 'jpeg' : type.ext)
      .toBuffer();
    req.file.size = req.file.buffer.length;

    next();
  } catch (error) {
    // [SECURITY] sharp throw error nếu buffer không phải ảnh hợp lệ
    // → Bắt lỗi thay vì pass lên global error handler, tránh leak stack trace
    return res.status(400).json({
      success: false,
      message: 'File ảnh bị lỗi hoặc không hợp lệ.'
    });
  }
};

module.exports = { upload, validateMagicNumber };
