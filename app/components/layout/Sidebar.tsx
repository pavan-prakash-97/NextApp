"use client";

import Link from "next/link";
import { useSession } from "@/app/lib/auth-client";
import { useState, useEffect } from "react";

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

  return (
    <aside className="w-64 border-r shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Dashboard</h2>

      <nav className="space-y-2">
        {role === "admin" && (
          <Link href="/admin" className="block p-2 hover:bg-white hover:text-black rounded">
            Admin Dashboard
          </Link>
        )}

        {["user", "admin"].includes(role ?? "") && (
          <Link href="/user" className="block p-2 hover:bg-white hover:text-black rounded">
            User Dashboard
          </Link>
        )}
      </nav>
    </aside>
  );
}
