const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImageBuffer = async (buffer, subFolder) => {
  return new Promise((resolve, reject) => {
    const folder = subFolder ? `lucy_class/${subFolder}` : 'lucy_class';
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

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
