"use client";

import RoleGuard from "@/app/components/feature/auth/RoleGuard";
import UpdateProfileForm from "@/app/components/feature/auth/UpdateProfileForm";

export default function UserDashboard() {
  return (
    <RoleGuard roles={["user", "admin"]}>
      <div>
        <h1 className="text-3xl font-bold text-[#FFF] mb-4">User Dashboard</h1>
        <p className="text-[#F4F4F4]">
          Welcome! Here is your personalized content.
        </p>

        <div className="mt-8">
          <UpdateProfileForm />
        </div>
      </div>
    </RoleGuard>
  );
}
