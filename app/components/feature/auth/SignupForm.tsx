"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { signUp } from "@/app/lib/auth-client";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  type SignUpPayload = {
    email: string;
    password: string;
    name: string;
    mobileNumber?: string;
    callbackURL?: string;
  };

  function normalizeMobile(num: string) {
    const cleaned = num.replace(/\D/g, ""); // keep only digits

    // If user already typed +91XXXXXXXXXX or 91XXXXXXXXXX
    if (cleaned.startsWith("91")) {
      return "+".concat(cleaned);
    }

    // If user typed 10 digits → assume Indian number
    if (cleaned.length === 10) {
      return "91".concat(cleaned);
    }

    // Fallback (still enforce +91)
    return "91".concat(cleaned);
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signUp.email({
        email,
        password,
        name,
        mobileNumber,
        callbackURL: "/user",
      } as SignUpPayload);

      if (error) {
        alert(error.message || "Signup failed");
        setLoading(false);
        return;
      }

      // Send welcome SMS after successful signup (non-blocking)
      try {
        await fetch("/api/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: normalizeMobile(mobileNumber),
            text: `Welcome ${name || "user"} to Next App!`,
          }),
        });
      } catch (smsErr) {
        console.warn("Failed to send welcome SMS:", smsErr);
      }

      router.push("/user");
    } catch (err) {
      console.error("Signup error:", err);
      alert("An error occurred during signup");
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSignup}
      className="space-y-5 text-gray-700"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Name Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          className="
        w-full border border-gray-300 rounded-full p-3 mt-1 
        focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
        transition-all duration-150
      "
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </motion.div>

      {/* Email Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
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

      {/* Mobile Number Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <label htmlFor="mobileNumber" className="text-sm font-medium">
          Mobile number
        </label>
        <input
          id="mobileNumber"
          type="tel"
          className="
        w-full border border-gray-300 rounded-full p-3 mt-1 
        focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
        transition-all duration-150
      "
          value={mobileNumber}
          onChange={(e) => {
            const val = e.target.value.replace(/^\+91\s?/, "");
            setMobileNumber(val);
          }}
          placeholder="+91 0123456789"
          required
        />
      </motion.div>

      {/* Password Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
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
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-pressed={showPassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline"
              >
                <path d="M17.94 17.94A10 10 0 0 1 6.06 6.06"></path>
                <path d="M1 1l22 22"></path>
                <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24"></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path>
                <circle cx={12} cy={12} r={3}></circle>
              </svg>
            )}
          </button>
        </div>
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
        {loading ? "Creating account..." : "Sign Up"}
      </motion.button>
    </motion.form>
  );
}
