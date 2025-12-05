import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { getRedisClient } from "@/app/lib/redis";
import { prisma } from "@/app/lib/prisma";

const WINDOW = 60; // seconds
const LIMIT = 10; // max requests per window

async function rateLimit(redis: any, key: string) {
  const now = Math.floor(Date.now() / 1000);

  const tx = redis.multi();
  tx.incr(key);
  tx.expire(key, WINDOW);
  const [count] = await tx.exec();

  const total = typeof count === "number" ? count : count[1];

  if (total > LIMIT) {
    return false;
  }

  return true;
}

export async function GET(request: Request, context: any) {
  const id = context?.params?.id;

  if (!id) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = (session.user.role ?? "user").toLowerCase() === "admin";

  if (!isAdmin && session.user.id !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redis = process.env.REDIS_URL ? getRedisClient() : undefined;

  // -----------------------------
  // 🔥 Redis Rate Limiter (per user)
  // -----------------------------
  if (redis) {
    const rlKey = `rl:get_user:${session.user.id}`;
    const allowed = await rateLimit(redis, rlKey);

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Too many requests (Rate limit exceeded)",
        },
        { status: 429 }
      );
    }
  }

  // -----------------------------
  // 🔥 Cache Lookup
  // -----------------------------
  const cacheKey = `cache:user:${id}`;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return NextResponse.json({ user: JSON.parse(cached) });
    } catch (err) {}
  }

  // -----------------------------
  // 🔥 DB Fetch
  // -----------------------------
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      profilePicSmall: true,
      profilePicLarge: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const respUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };

  // -----------------------------
  // 🔥 Cache Set
  // -----------------------------
  if (redis) {
    try {
      await redis.set(cacheKey, JSON.stringify(respUser), {
        EX: Number(process.env.REDIS_CACHE_TTL || 60),
      });
    } catch (err) {}
  }

  return NextResponse.json({ user: respUser });
}
