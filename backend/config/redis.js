const Redis = require('ioredis');

const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    })
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

module.exports = redisClient;
