import { headers } from "next/headers";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import { getCurrentUserServer } from "../lib/server-user";
import { UserProvider } from "../context/userContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserServer(await headers());

  return (
    <UserProvider user={user}>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-700 to-black">
        <Topbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </UserProvider>
  );
}
