import { NextResponse } from "next/server";
import { Vonage } from '@vonage/server-sdk';

export async function POST(req: Request) {
  const { to, text } = await req.json();

  const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY!,
    apiSecret: process.env.VONAGE_API_SECRET!,
  });

  try {
    const response = await vonage.sms.send({
      to,
      from: "NextAppTestPOC",
      text,
    });

    return NextResponse.json({ success: true, response });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
