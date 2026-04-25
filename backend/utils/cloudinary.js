const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const UPLOAD_TIMEOUT_MS = 20000; // 20s — phù hợp mạng chập chờn
const MAX_RETRIES = 2;

/**
 * Upload ảnh lên Cloudinary từ buffer.
 * - Tự timeout sau 20s nếu mạng treo (upload_stream không tự timeout)
 * - Tự retry tối đa 2 lần nếu lỗi timeout hoặc lỗi server Cloudinary (5xx)
 * - Backoff 1.5s giữa các lần retry
 */
const uploadImageBuffer = async (buffer, subFolder, attempt = 1) => {
  return new Promise((resolve, reject) => {
    const folder = subFolder ? `lucy_class/${subFolder}` : 'lucy_class';

    // Timeout thủ công vì upload_stream không tự timeout
    const timer = setTimeout(() => {
      reject(new Error(`Cloudinary upload timeout after ${UPLOAD_TIMEOUT_MS}ms`));
    }, UPLOAD_TIMEOUT_MS);

    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        clearTimeout(timer);
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  }).catch(async (err) => {
    // Retry nếu còn lượt và lỗi là timeout hoặc lỗi server Cloudinary
    const isRetryable = err.message?.includes('timeout') || err.http_code >= 500;
    if (attempt < MAX_RETRIES && isRetryable) {
      console.warn(`[Cloudinary] Upload failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${1500 * attempt}ms...`, err.message);
      await new Promise(r => setTimeout(r, 1500 * attempt)); // exponential backoff
      return uploadImageBuffer(buffer, subFolder, attempt + 1);
    }
    throw err;
  });
};

/**
 * Xoá ảnh khỏi Cloudinary theo publicId.
 * Lỗi được bắt và log nhẹ — không throw để tránh làm hỏng flow chính.
 */
const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('[Cloudinary Delete]', {
      publicId,
      error: err.message
    });
  }
};

module.exports = {
  uploadImageBuffer,
  deleteImageFromCloudinary
};
