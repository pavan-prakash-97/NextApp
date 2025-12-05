import { auth } from "@/app/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { makeRedisLimiter } from "@/app/lib/redis-rate-limit";
import { validateRequest } from "@/app/lib/validation-helpers";
import { updateUserProfileSchema } from "@/app/lib/validations";
import { prisma } from "@/app/lib/prisma";
import { logInfo, logError } from "@/app/lib/logger-helpers";
import { getRedisClient } from "@/app/lib/redis";
import { sendProfileUpdateEmail } from "@/app/lib/email";
import * as Sentry from "@sentry/nextjs";

// Get current user
export async function GET(req: NextRequest) {
  try {
    if (process.env.REDIS_URL) {
      const redisLimiter = makeRedisLimiter({
        interval: 15 * 60 * 1000,
        limit: 200,
      });
      await redisLimiter.check(req, 1);
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      // preserve a `status` property if thrown by the limiter
      const status = (e as unknown as { status?: number })?.status ?? 429;
      return NextResponse.json(
        { error: e.message ?? "Too many requests" },
        { status }
      );
    }
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    logInfo("Unauthorized access attempt to GET /api/user", {
      ip: req.headers.get("x-forwarded-for") || "unknown",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logInfo("User profile retrieved", { userId: session.user.id });
  return NextResponse.json({ user: session.user });
}

// Update user profile
export async function PATCH(req: NextRequest) {
  try {
    if (process.env.REDIS_URL) {
      const redisLimiter = makeRedisLimiter({
        interval: 15 * 60 * 1000,
        limit: 50,
      });
      await redisLimiter.check(req, 1);
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      const status = (e as unknown as { status?: number })?.status ?? 429;
      return NextResponse.json(
        { error: e.message ?? "Too many requests" },
        { status }
      );
    }
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    logInfo("Unauthorized access attempt to PATCH /api/user", {
      ip: req.headers.get("x-forwarded-for") || "unknown",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate request body
  const { data, error } = await validateRequest(req, updateUserProfileSchema);
  if (error) {
    logInfo("Validation failed for PATCH /api/user", {
      userId: session.user.id,
    });
    return error;
  }

  try {
    const { name, profilePicSmall, mobileNumber } = data;

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(profilePicSmall !== undefined && { profilePicSmall }),
        ...(mobileNumber !== undefined && { mobileNumber }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicSmall: true,
        profilePicLarge: true,
        role: true,
      },
    });

    logInfo("User profile updated successfully", {
      userId: session.user.id,
      updatedFields: Object.keys(data),
    });

    // Invalidate caches related to users list and specific user
    if (process.env.REDIS_URL) {
      try {
        const redis = getRedisClient();
        const keysToDel = [`cache:user:${updatedUser.id}`, `cache:users:all`];
        for (const k of keysToDel) {
          await redis.del(k);
        }
        logInfo("Invalidated user cache keys", { keys: keysToDel });
      } catch (err) {
        // cache invalidation failure should not block success response
        logError(err as Error, {
          userId: session.user.id,
          context: "Cache invalidation failed",
        });
      }
    }

    // Send email notification
    try {
      await sendProfileUpdateEmail(
        updatedUser.email!,
        updatedUser.name || "User"
        // Object.keys(data)
      );
      logInfo("Profile update email sent", { userId: session.user.id });
    } catch (emailError) {
      // Log error but don't fail the request
      logError(emailError as Error, {
        userId: session.user.id,
        context: "Email notification failed",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    Sentry.captureException(error);
    logError(error as Error, {
      userId: session.user.id,
      endpoint: "PATCH /api/user",
    });
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
