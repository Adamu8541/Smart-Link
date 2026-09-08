import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async () => {
  if (!client.isOpen) {
    try {
      await client.connect();
      console.log('[Redis] Connected');
    } catch (err) {
      console.error('[Redis] Connection failed, continuing without cache:', err);
    }
  }
};

export default client;
