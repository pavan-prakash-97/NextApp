import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export default async function UserList() {
  const reqHeaders = await headers();
  // Convert ReadonlyHeaders -> plain object so that it matches HeadersInit
  const headerObj = Object.fromEntries(Array.from(reqHeaders.entries())) as Record<string, string>;

  const session = await auth.api.getSession({ headers: headerObj });
  if (!session?.user?.id) {
    // Not logged in
    redirect("/login");
  }

  // Ensure admin role server-side
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || (user.role ?? "USER").toLowerCase() !== "admin") {
    redirect("/login");
  }

  // Fetch users from DB, exclude current admin
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const otherUsers = users.filter((u) => u.id !== session.user.id);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Users</h2>
      <div className="overflow-x-auto bg-white rounded-md border border-gray-100 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-sm font-medium text-gray-500">User</th>
              <th className="px-4 py-2 text-sm font-medium text-gray-500">Email</th>
              <th className="px-4 py-2 text-sm font-medium text-gray-500">Role</th>
              <th className="px-4 py-2 text-sm font-medium text-gray-500">Created</th>
              <th className="px-4 py-2 text-sm font-medium text-gray-500">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {otherUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 flex items-center gap-3">
                  {u.image ? (
                    <img src={u.image} alt={u.name ?? "avatar"} className="h-8 w-8 rounded-full object-cover border" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center border">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                        <path d="M20 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M4 21v-2a4 4 0 0 1 3-3.87"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  )}

                  <div className="flex flex-col">
                    <span className="text-gray-800 font-medium">{u.name ?? "—"}</span>
                    <span className="text-xs text-gray-500">{u.id}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{u.email ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{u.role ?? "user"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{u.createdAt.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{u.updatedAt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
