"use client";

// Better Auth doesn't require a session provider wrapper
// Session is managed automatically via cookies
export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
