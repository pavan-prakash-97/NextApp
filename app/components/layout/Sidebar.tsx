"use client";

import { useUser } from "@/app/context/userContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const { user } = useUser();
  const pathname = usePathname();

  const getLinkClass = (href: string, exact = false) => {
    const isActive = exact ? pathname === href : pathname?.startsWith(href);
    return `block p-2 rounded transition-colors ${
      isActive
        ? "bg-white text-black"
        : "text-white hover:bg-white hover:text-black"
    }`;
  };

  return (
    <aside className="w-64 border-r shadow-sm p-6 bg-gray-800">
      <h2 className="text-xl font-semibold text-[#FFF] mb-6">Dashboard</h2>

      <nav className="space-y-2">
        {user?.role === "admin" && (
          <Link
            href="/admin"
            className={getLinkClass("/admin", true)}
            aria-current={pathname === "/admin" ? "page" : undefined}
          >
            Dashboard
          </Link>
        )}

        {user?.role === "admin" && (
          <Link
            href="/admin/users"
            className={getLinkClass("/admin/users")}
            aria-current={
              pathname?.startsWith("/admin/users") ? "page" : undefined
            }
          >
            User List
          </Link>
        )}

        {["user"].includes(user?.role ?? "") && (
          <Link
            href="/user"
            className={getLinkClass("/user")}
            aria-current={pathname?.startsWith("/user") ? "page" : undefined}
          >
            Dashboard
          </Link>
        )}
      </nav>
    </aside>
  );
}
