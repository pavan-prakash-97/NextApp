import * as rateLimitPkg from "@daveyplate/next-rate-limit";

// Minimal Limiter shape used by the app (exposes `.check(req, points?)`).
type Limiter = {
  check: (req: unknown, points?: number) => Promise<unknown>;
};

// Resolve runtime export: package may export the factory as `default` (ESM)
// or as the module itself (CommonJS). Use whichever is available.
const rawRateLimit: unknown = (rateLimitPkg as any).default ?? rateLimitPkg;
const makeLimiter = (rawRateLimit as unknown) as (opts: { interval: number; limit: number }) => Limiter;

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
