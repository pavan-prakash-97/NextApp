import { defineConfig } from "eslint/config";
import nextConfig from "eslint-config-next";

export default defineConfig([
  ...nextConfig, // ← NOT nextConfig(), it's an array
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist-worker/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
]);
