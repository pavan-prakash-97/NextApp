import { auth } from "@/app/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/app/lib/validation-helpers";
import { updateUserProfileSchema } from "@/app/lib/validations";
import { prisma } from "@/app/lib/prisma";
import { logInfo, logError } from "@/app/lib/logger-helpers";
import { sendProfileUpdateEmail } from "@/app/lib/email";

// Get current user
export async function GET(req: NextRequest) {
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
    const { name, image } = data;

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    logInfo("User profile updated successfully", {
      userId: session.user.id,
      updatedFields: Object.keys(data),
    });

    // Send email notification
    try {
      await sendProfileUpdateEmail(
        updatedUser.email!,
        updatedUser.name || "User",
        Object.keys(data)
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
    logError(error as Error, {
      userId: session.user.id,
      endpoint: "PATCH /api/user",
    });
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
