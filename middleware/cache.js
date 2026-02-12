import redis from "../config/redis.js";

export const cache = (keyPrefix, ttl = 60) => {
  return async (req, res, next) => {
    const key = `${keyPrefix}:${req.originalUrl}`;

    const cached = await redis.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    res.sendResponse = res.json;
    res.json = (body) => {
      redis.setex(key, ttl, JSON.stringify(body));
      res.sendResponse(body);
    };

    next();
  };
};
