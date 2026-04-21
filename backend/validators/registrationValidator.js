const cooldowns = new Map();

// ✅ FIX: Thêm bộ hẹn giờ setInterval dọn dẹp biến IP hết hạn khỏi Map mỗi 5 phút để chống Memory Leak
const COOLDOWN_MS = 30000;
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamp] of cooldowns.entries()) {
    if (now - timestamp > COOLDOWN_MS) cooldowns.delete(ip);
  }
}, 5 * 60 * 1000);

/**
 * Middleware to validate registration form data, check for honeypot, and enforce submission cooldown.
 */
const validateCooldown = (req, res, next) => {
  const { parentName, childName, phone, childAge, email, website } = req.body;
  const ip = req.ip;

  // 1. Bot Trap (Honeypot)
  if (website) {
    return res.status(400).json({ message: 'Bot detected. Submission rejected.' });
  }

  // 2. Submit Cooldown
  const now = Date.now();
  const lastSubmit = cooldowns.get(ip);
  if (lastSubmit && now - lastSubmit < COOLDOWN_MS) {
    return res.status(400).json({ message: 'Too many submissions. Please wait 10 seconds.' });
  }
  cooldowns.set(ip, now);

  // 3. Input Validation

  // Parent Name: required, trim, <= 32 chars
  if (!parentName || parentName.trim().length === 0) {
    return res.status(400).json({ message: 'Parent name is required' });
  }
  if (parentName.trim().length > 32) {
    return res.status(400).json({ message: 'Parent name must be 32 characters or less' });
  }

  // Student (Child) Name: required, trim, <= 32 chars
  if (!childName || childName.trim().length === 0) {
    return res.status(400).json({ message: 'Student name is required' });
  }
  if (childName.trim().length > 32) {
    return res.status(400).json({ message: 'Student name must be 32 characters or less' });
  }

  // Phone: required, digits only, length 9-11
  const phoneRegex = /^[0-9]{9,11}$/;
  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be between 9 and 11 digits' });
  }

  // Age group: phải là 1 trong 5 key hợp lệ
  const VALID_AGE_GROUPS = ['preschool', 'primary', 'secondary', 'highschool', 'adult'];
  if (!childAge || !VALID_AGE_GROUPS.includes(childAge)) {
    return res.status(400).json({ message: 'Invalid age group' });
  }

  // Email: optional, valid format
  if (email && email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
  }

  // Sanitize inputs (basic trim)
  req.body.parentName = parentName.trim();
  req.body.childName = childName.trim();
  if (email) req.body.email = email.trim();

  next();
};

// ✅ FIX: Export tên custom `validateCooldown` để gọi thống nhất trong model router
module.exports = { validateCooldown };
