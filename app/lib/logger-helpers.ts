import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import logger from "@/app/lib/logger";

export function logAPIRequest(req: NextRequest, res: NextResponse, duration: number) {
  const { method, url, headers } = req;
  const userAgent = headers.get("user-agent") || "unknown";
  const ip = headers.get("x-forwarded-for") || headers.get("x-real-ip") || "unknown";

  logger.http("API Request", {
    method,
    url,
    status: res.status,
    duration: `${duration}ms`,
    ip,
    userAgent,
  });
}

export function logError(error: Error, context?: Record<string, unknown>) {
  logger.error(error.message, {
    stack: error.stack,
    ...context,
  });
}

export function logInfo(message: string, meta?: Record<string, unknown>) {
  logger.info(message, meta);
}

export function logWarning(message: string, meta?: Record<string, unknown>) {
  logger.warn(message, meta);
}

export function logDebug(message: string, meta?: Record<string, unknown>) {
  logger.debug(message, meta);
}
