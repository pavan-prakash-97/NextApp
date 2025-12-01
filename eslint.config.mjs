// eslint.config.mjs

import { defineConfig } from "eslint/config";
import nextConfig from "eslint-config-next";

export default defineConfig([
  {
    ...nextConfig,
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "build/**",
      "out/**",
      "next-env.d.ts",
    ],
  },
]);
