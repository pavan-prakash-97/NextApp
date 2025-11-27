import Link from "next/link";

export default function HomePage() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-semibold mb-4">Welcome</h1>
      <Link href="/dashboard/user" className="underline text-blue-600">
        Go to Dashboard
      </Link>
    </div>
  );
}
