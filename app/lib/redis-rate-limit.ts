import type { NextRequest } from "next/server";
import { getRedisClient } from "./redis";

type RedisLimiterOptions = {
  interval: number; // ms
  limit: number;
  prefix?: string;
};

export function makeRedisLimiter(opts: RedisLimiterOptions) {
  const { interval, limit, prefix = "rl" } = opts;
  const ttlSeconds = Math.ceil(interval / 1000);

  async function getKeyFromReq(req: NextRequest) {
    // Prefer session token for a per-user rate limit, fall back to IP
    try {
      const cookieToken = req.cookies?.get("better-auth.session_token")?.value;
      if (cookieToken) return `${prefix}:session:${cookieToken}`;
    } catch {
      // ignore errors while reading cookies
    }
    const xff = req.headers?.get("x-forwarded-for") ?? "";
    const ip = xff.split(",")[0] || req.headers?.get("x-real-ip") || "unknown";
    return `${prefix}:ip:${ip}`;
  }

  async function check(req: NextRequest, points = 1) {
    const redis = getRedisClient();
    const key = await getKeyFromReq(req);
    if (!redis) return;

    // Use a single INCRBY + TTL set when it's first seen
    const count = await redis.incrBy(key, points);
    if (count === points) {
      // If first increment (previously key did not exist), set TTL
      await redis.expire(key, ttlSeconds);
    }

    if (count > limit) {
      const ttl = await redis.ttl(key);
      const err: any = new Error("Too many requests. Please try again later.");
      err.status = 429;
      err.retryAfter = ttl > 0 ? ttl : ttlSeconds;
      throw err;
    }
  }

  return { check };
}

export default makeRedisLimiter;
