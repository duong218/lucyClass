const DEVICE_KEY = 'streak_device_id';

/**
 * Get or create a unique device ID (stored in localStorage)
 * - Generated once per browser/device
 * - Persisted across sessions
 */
export const getDeviceId = () => {
  try {
    let deviceId = localStorage.getItem(DEVICE_KEY);

    if (!deviceId) {
      deviceId = crypto.randomUUID(); // native, không cần thư viện
      localStorage.setItem(DEVICE_KEY, deviceId);
    }

    return deviceId;
  } catch (_err) {
    // fallback nếu localStorage lỗi (private mode, etc.)
    return 'unknown-device';
  }
};
