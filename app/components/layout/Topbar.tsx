"use client";

import { signOut, useSession } from "@/app/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function Topbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full h-16 border-b shadow-sm flex items-center justify-between px-6 bg-gray-800">
      <h1 className="text-2xl text-[#FFF] font-semibold">Next App</h1>

      <div className="relative flex items-center gap-4" ref={dropdownRef}>
        {user && (
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-3 cursor-pointer"
          >
            {user.image ? (
              <img
                src={user.image}
                alt={user.name ?? "avatar"}
                className="h-10 w-10 rounded-full object-cover border"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-600"
                >
                  <path d="M20 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M4 21v-2a4 4 0 0 1 3-3.87"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            )}

            <span className="text-white  font-medium">
              {user.name ?? user.email}
            </span>
          </button>
        )}

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-14 w-44 bg-white border rounded-lg shadow-lg py-2 animate-dropdown">
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
