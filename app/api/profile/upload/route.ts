import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/app/lib/s3"; // shared S3 client
import { imageQueue } from "@/app/queues/image.queue";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, userId } = await req.json();

    if (!imageBase64 || !userId) {
      return NextResponse.json(
        { error: "imageBase64 and userId are required" },
        { status: 400 }
      );
    }

    // Convert base64 → buffer
    const buffer = Buffer.from(
      imageBase64.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const originalKey = `profile/${userId}/original.jpg`;

    // Upload original image to S3
    const uploadRes = await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!, // must exist in .env
        Key: originalKey,
        Body: buffer,
        ContentType: "image/jpeg",
      })
    );

    // Add job to BullMQ (worker should resize)
    await imageQueue.add("resize", { userId, originalKey });

    return NextResponse.json({
      message: "Image uploaded successfully. Processing started…",
      key: originalKey,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed", details: err },
      { status: 500 }
    );
  }
}
