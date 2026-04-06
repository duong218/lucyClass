const envUrl = import.meta.env.VITE_API_URL || "";
export const API_BASE_URL = (envUrl.includes('localhost:5000') || envUrl.includes('127.0.0.1:5000')) 
  ? "" 
  : envUrl;
