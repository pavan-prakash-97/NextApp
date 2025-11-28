"use client";

import Link from "next/link";
import { useSession } from "@/app/lib/auth-client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const { data: session } = useSession();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      if (!session?.user?.id) return;
      try {
        const res = await fetch("/api/user/role");
        if (res.ok) {
          const data = await res.json();
          setRole(data.role?.name || null);
        }
      } catch (error) {
        console.error("Failed to fetch role:", error);
      }
    }
    fetchRole();
  }, [session]);

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
        {role === "admin" && (
          <Link
            href="/admin"
            className={getLinkClass("/admin", true)}
            aria-current={pathname === "/admin" ? "page" : undefined}
          >
            Dashboard
          </Link>
        )}

        {role === "admin" && (
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

        {["user"].includes(role ?? "") && (
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
