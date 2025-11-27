import UserList from "@/app/components/feature/admin/UserList";

export default async function AdminUsersPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-4">Users</h1>
      <UserList />
    </div>
  );
}
