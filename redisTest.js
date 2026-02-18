import { createClient } from 'redis';

const client = createClient({
  url: 'redis://127.0.0.1:6379'
});

async function testRedis() {
  try {
    await client.connect();
    console.log('✅ Redis connected from Node');

    await client.set('test', '123');
    const value = await client.get('test');
    console.log('Value from Redis:', value);

    await client.quit();
    console.log('Redis connection closed');
  } catch (err) {
    console.error('Redis error:', err);
  }
}

testRedis();
