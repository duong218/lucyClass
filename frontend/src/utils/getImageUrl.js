const envUrl = import.meta.env.VITE_API_URL || "";
const BASE_URL = (envUrl.includes('localhost:5000') || envUrl.includes('127.0.0.1:5000')) 
  ? "" 
  : envUrl;

export const getImageUrl = (image) => {
  try {
    if (!image || typeof image !== 'string') return "/placeholder.jpg";

    // external URL or data URL (keep as-is)
    if (image.startsWith("http") || image.startsWith("data:")) return image;

    // Handle both old (/uploads/...) and new (filename only) paths
    const filename = image.startsWith('/uploads/') ? image.slice(9) : image;

    // Robust join to avoid double slashes
    const baseUrlClean = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    const finalUrl = `${baseUrlClean}/uploads/${filename}`;
    
    return finalUrl;
  } catch (error) {
    console.error('[ImageHelper] Error constructing URL:', error);
    return "/placeholder.jpg";
  }
};
