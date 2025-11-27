import { auth } from "@/app/lib/auth";
import { getUserWithRole } from "@/app/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { logInfo, logError } from "@/app/lib/logger-helpers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    logInfo("Unauthorized access attempt to GET /api/user/role", {
      ip: req.headers.get("x-forwarded-for") || "unknown",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await getUserWithRole(session.user.id);

    if (!user) {
      logInfo("User not found", { userId: session.user.id });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    logInfo("User role retrieved", {
      userId: session.user.id,
      role: user.role,
    });

    return NextResponse.json({
      role: { name: user.role },
    });
  } catch (error) {
    logError(error as Error, {
      userId: session.user.id,
      endpoint: "GET /api/user/role",
    });
    return NextResponse.json({ error: "Failed to fetch user role" }, { status: 500 });
  }
}
