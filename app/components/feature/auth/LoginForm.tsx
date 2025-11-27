"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { signIn } from "@/app/lib/auth-client";
import { userApi } from "@/app/lib/api-client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn.email({
        email,
        password,
        callbackURL: "/user",
      });

      if (error) {
        alert(error.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      try {
        const { role } = await userApi.getRole();
        if (role?.name === "admin") router.push("/admin");
        else router.push("/user");
      } catch {
        router.push("/user");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleLogin}
      className="space-y-5 text-gray-700"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Email Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          className="
            w-full border border-gray-300 rounded-full p-3 mt-1 
            focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
            transition-all duration-150
          "
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </motion.div>

      {/* Password Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="text-sm font-medium">Password</label>
        <input
          type="password"
          className="
            w-full border border-gray-300 rounded-full p-3 mt-1 
            focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
            transition-all duration-150
          "
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </motion.div>

      {/* Submit Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        type="submit"
        disabled={loading}
        className="
          w-full bg-gray-800 text-white py-3 mt-3 rounded-full shadow-md 
          hover:bg-indigo-700 transition disabled:opacity-60
        "
      >
        {loading ? "Logging in..." : "Login"}
      </motion.button>
    </motion.form>
  );
}
