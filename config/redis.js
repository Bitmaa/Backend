import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL
});

redis.on("error", (err) => console.error("Redis Client Error", err));

await redis.connect();  // Make sure Node version supports top-level await

export default redis;
