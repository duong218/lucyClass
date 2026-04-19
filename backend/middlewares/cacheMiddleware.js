const redisClient = require('../config/redis');

const CACHE_TTL = 300; // 5 phút

const cacheMiddleware = (ttl = CACHE_TTL) => async (req, res, next) => {
  if (req.method !== 'GET') return next();

  const key = `cache:${req.originalUrl}`;

  try {
    const cached = await redisClient.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
  } catch (err) {
    console.error('Cache read error:', err.message);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      redisClient
        .setex(key, ttl, JSON.stringify(body))
        .catch((err) => console.error('Cache write error:', err.message));
    }
    return originalJson(body);
  };

  next();
};

const clearCache = async (urlPrefix) => {
  try {
    let cursor = '0';
    const pattern = `cache:${urlPrefix}*`;
    do {
      const [nextCursor, keys] = await redisClient.scan(
        cursor, 'MATCH', pattern, 'COUNT', 100
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await redisClient.del(keys); // ioredis nhận array trực tiếp, không cần spread
      }
    } while (cursor !== '0');
  } catch (err) {
    console.error('Cache clear error:', err.message);
  }
};

module.exports = { cacheMiddleware, clearCache };
