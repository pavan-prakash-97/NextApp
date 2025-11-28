import { auth } from "@/app/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getRedisClient } from "@/app/lib/redis";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const p = await ctx.params;
  const { id } = p as { id: string };

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only allow access if the requestor is admin or the owner of the record
  const userIsAdmin = (session.user.role ?? "user").toLowerCase() === "admin";
  if (!userIsAdmin && session.user.id !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redis = process.env.REDIS_URL ? getRedisClient() : undefined;
  const cacheKey = `cache:user:${id}`;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return NextResponse.json({ user: JSON.parse(cached) });
    } catch {
      // ignore redis errors
    }
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const respUser = { ...user, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() };

  if (redis) {
    try {
      const ttl = Number(process.env.REDIS_CACHE_TTL || 60);
      await redis.set(cacheKey, JSON.stringify(respUser), { EX: ttl });
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ user: respUser });
}
