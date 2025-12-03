import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

// export async function getCurrentUserServer(headersObj: ReadonlyHeaders) {
//   const session = await auth.api.getSession({ headers: headersObj });

//   if (!session?.user) return null;

//   const id = session.user.id;

//   const user = await prisma.user.findUnique({
//     where: { id },
//     select: {
//       id: true,
//       name: true,
//       email: true,
//       role: true,
//       profilePicSmall: true,
//       profilePicLarge: true,
//       createdAt: true,
//       updatedAt: true,
//     },
//   });

//   if (!user) return null;

//   return {
//     ...user,
//     createdAt: user.createdAt.toISOString(),
//     updatedAt: user.updatedAt.toISOString(),
//   };
// }

export async function getCurrentUserServer(headers: Headers) {
  const session = await auth.api.getSession({ headers });

  if (!session?.user) return null;

  const id = session.user.id;

  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      mobileNumber: true,
      profilePicSmall: true,
      profilePicLarge: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
