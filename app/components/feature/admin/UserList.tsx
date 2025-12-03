import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { getRedisClient } from "@/app/lib/redis";

// shadcn/ui components (assumes these exports exist in your project)
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type CachedUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  profilePicLarge?: string | null;
  profilePicSmall?: string | null;
  role?: string | null;
  mobileNumber?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default async function UserList() {
  const reqHeaders = await headers();
  const headerObj = Object.fromEntries(
    Array.from(reqHeaders.entries())
  ) as Record<string, string>;

  const session = await auth.api.getSession({ headers: headerObj });
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || (user.role ?? "USER").toLowerCase() !== "admin")
    redirect("/login");

  let users = [] as CachedUser[];
  const redis = process.env.REDIS_URL ? getRedisClient() : undefined;
  const cacheKey = "cache:users:all";

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        users = JSON.parse(cached) as CachedUser[];
        console.log("Inside cached");
      }
    } catch {
      // ignore
    }
  }

  if (!users || users.length === 0) {
    console.log("Inside DB call");
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

    users = fetched.map((u: any) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    if (redis) {
      try {
        const ttl = Number(process.env.REDIS_CACHE_TTL || 60);
        await redis.set(cacheKey, JSON.stringify(users), { EX: ttl });
      } catch {
        // ignore
      }
    }
  }

  const otherUsers = users.filter((u) => u.id !== session.user.id);

  return (
    <div>
      <Card className="overflow-x-auto bg-white rounded-md border border-gray-100 shadow-sm">
        <CardContent className="p-0">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-sm font-medium text-gray-500">
                  User
                </th>
                <th className="px-4 py-2 text-sm font-medium text-gray-500">
                  Email
                </th>
                <th className="px-4 py-2 text-sm font-medium text-gray-500">
                  Mobile
                </th>
                <th className="px-4 py-2 text-sm font-medium text-gray-500">
                  Role
                </th>
                <th className="px-4 py-2 text-sm font-medium text-gray-500">
                  Created
                </th>
                <th className="px-4 py-2 text-sm font-medium text-gray-500">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {otherUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 flex items-center gap-3">
                    {u.profilePicSmall ? (
                      <Avatar>
                        <AvatarImage
                          src={u.profilePicSmall}
                          alt={u.name ?? "avatar"}
                        />
                        <AvatarFallback>
                          {(u.name ?? "").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar>
                        <AvatarFallback>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M4 21v-2a4 4 0 0 1 3-3.87"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className="flex flex-col">
                      <span className="text-gray-800 font-medium">
                        {u.name ?? "—"}
                      </span>
                      <span className="text-xs text-gray-500">{u.id}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {u.email ?? "—"}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {u.mobileNumber ?? "—"}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {u.role ?? "user"}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {new Date(u.createdAt).toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {new Date(u.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
