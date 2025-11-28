import { NextResponse } from "next/server";
import { pingRedis } from "@/app/lib/redis";

export async function GET() {
  const ok = await pingRedis();
  return NextResponse.json({ ok, timestamp: new Date().toISOString() });
}
