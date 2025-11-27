import RoleGuard from "@/app/components/feature/auth/RoleGuard";

export default function AdminDashboard() {
  return (
    <RoleGuard roles={["admin"]}>
      <div>
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-[#F4F4F4]">
          Welcome, Admin! Here are your analytics and tools.
        </p>
      </div>
    </RoleGuard>
  );
}
