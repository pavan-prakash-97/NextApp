import * as rateLimitPkg from "@daveyplate/next-rate-limit";
import type { NextRequest } from "next/server";

// The limiter returned by the library exposes a `.check(req, points?)` method
// that the middleware will call. We type `req` precisely as `NextRequest`.
type Limiter = {
  check: (req: NextRequest, points?: number) => Promise<void>;
};

// Factory shape from the package: a function that returns a `Limiter`.
type RateLimitFactory = (opts: { interval: number; limit: number }) => Limiter;

// The library sometimes exports the factory as the module itself (CommonJS) or
// as the `default` property (ESM). Narrow the shape safely using runtime checks
// and avoid using `any` for typing.
type RateLimitModule = RateLimitFactory | { default: RateLimitFactory };
const rateLimitModule = rateLimitPkg as unknown as RateLimitModule;

const makeLimiter: RateLimitFactory = ((): RateLimitFactory => {
  if (typeof rateLimitModule === "function") {
    return rateLimitModule as RateLimitFactory;
  }
  if (
    rateLimitModule &&
    typeof (rateLimitModule as { default?: unknown }).default === "function"
  ) {
    return (rateLimitModule as { default: RateLimitFactory }).default;
  }
  throw new Error("@daveyplate/next-rate-limit: unsupported module shape");
})();

export const apiLimiter = makeLimiter({
  interval: 15 * 60 * 1000, // 15 minutes in milliseconds
  limit: 100,
});

export const authLimiter = makeLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  limit: 5,
});

export const loginLimiter = makeLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  limit: 10,
});

export const readLimiter = makeLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  limit: 200,
});

export const writeLimiter = makeLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  limit: 50,
});
