"use client";

import SignupForm from "@/app/components/feature/auth/SignupForm";
import Link from "next/link";
import { motion } from "framer-motion";

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full border flex items-center justify-center p-6">
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md border bg-white shadow-xl rounded-2xl p-8 border border-gray-100"
      >
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold mb-6 text-center text-gray-700"
        >
          Create your account
        </motion.h1>

        <SignupForm />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6 text-gray-600"
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-fuchsia-600 hover:text-fuchsia-700 font-medium transition"
          >
            Login here
          </Link>
        </motion.p>
      </motion.div>

    </div>
  );
}
