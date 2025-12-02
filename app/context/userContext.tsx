"use client";

import { createContext, useContext, useState, useCallback } from "react";

// User type matching your DB + server-user.ts response
export interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  mobileNumber: string | null;
  profilePicSmall: string | null;
  profilePicLarge: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface UserContextType {
  user: UserData | null;
  setUser: (u: UserData | null) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  refreshUser: async () => {},
});

export function UserProvider({
  user: initialUser,
  children,
}: {
  user: UserData | null;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserData | null>(initialUser);

  // 👉 React Compiler-safe version of refreshUser
  const refreshUser = useCallback(async () => {
    if (!user) return;

    const res = await fetch(`/api/user/${user.id}`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) return;

    const data = await res.json();
    setUser(data.user);
  }, [user]); // react compiler approves this

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
