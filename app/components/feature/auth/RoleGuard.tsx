"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/app/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { userApi } from "@/app/lib/api-client";
import * as Sentry from "@sentry/nextjs";
export default function RoleGuard({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (isPending) return;

      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await userApi.getRole();
        setUserRole(data.role || null);
      } catch (error) {
        Sentry.captureException(error);
        console.error("Failed to fetch user role:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, [session, isPending]);

  useEffect(() => {
    if (isPending || isLoading) return;

    // Not logged in → go to login
    if (!userRole) {
      router.replace("/login");
      return;
    }

    // Role allowed → do nothing
    if (roles.includes(userRole)) {
      return;
    }

    // ❌ Role NOT allowed → redirect based on user role
    if (userRole === "admin") {
      if (!pathname.startsWith("/admin")) {
        router.replace("/admin");
      }
      return;
    }

    if (userRole === "user") {
      if (!pathname.startsWith("/user")) {
        router.replace("/user");
      }
      return;
    }

    // Fallback
    router.replace("/login");
  }, [userRole, isLoading, isPending, router, pathname, roles]);

  // Don't render children during redirect
  if (isPending || isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-transparent z-50">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userRole || !roles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}
