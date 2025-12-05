import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const fetched = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      profilePicLarge: true,
      profilePicSmall: true,
      mobileNumber: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log('fetched>>>>>', fetched)

  return NextResponse.json(fetched);
}
