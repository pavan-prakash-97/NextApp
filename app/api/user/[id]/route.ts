import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { getRedisClient } from "@/app/lib/redis";
import { prisma } from "@/app/lib/prisma";

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
  const cacheKey = `cache:user:${id}`;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return NextResponse.json({ user: JSON.parse(cached) });
    } catch {}
  }

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

  if (redis) {
    try {
      await redis.set(cacheKey, JSON.stringify(respUser), {
        EX: Number(process.env.REDIS_CACHE_TTL || 60),
      });
    } catch {}
  }

  return NextResponse.json({ user: respUser });
}
