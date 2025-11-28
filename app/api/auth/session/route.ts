import { auth } from "@/app/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { makeRedisLimiter } from "@/app/lib/redis-rate-limit";

// If REDIS_URL is provided we use a Redis-backed limiter for server-side
// endpoints. Note: middleware runs on the Edge runtime in Next.js, and the
// Redis client cannot be used from Edge, so we only apply this limiter here
// at the server route level as a second layer of protection.
const redisLimiter = makeRedisLimiter({ interval: 15 * 60 * 1000, limit: 200 });

export async function GET(req: NextRequest) {
  try {
    if (process.env.REDIS_URL) await redisLimiter.check(req, 1);
  } catch (err: unknown) {
    if (err instanceof Error) {
      const status = (err as unknown as { status?: number })?.status ?? 429;
      return NextResponse.json(
        { error: err.message ?? "Too many requests" },
        { status }
      );
    }
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: session.user,
    session: session.session,
  });
}
