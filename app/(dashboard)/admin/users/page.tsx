import UserList from "@/app/components/feature/admin/UserList";

export default async function AdminUsersPage() {
  return (
    <div className="">
      <h1 className="text-3xl font-semibold text-[#FFF] mb-4">Users</h1>
      <UserList />
    </div>
  );
}
