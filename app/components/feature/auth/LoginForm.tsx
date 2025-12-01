"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { signIn } from "@/app/lib/auth-client";
import { userApi } from "@/app/lib/api-client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <motion.div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
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
      <motion.div>
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className="
              w-full border border-gray-300 rounded-full p-3 mt-1 
              focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
              transition-all duration-150
            "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-pressed={showPassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </motion.div>

      {/* Submit Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
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
