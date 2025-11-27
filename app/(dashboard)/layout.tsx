import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-700 to-black">

      {/* Full-width Topbar */}
      <Topbar />

      {/* Sidebar + Main Content */}
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>

    </div>
  );
}
