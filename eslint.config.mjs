import next from "eslint-plugin-next";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    plugins: { next },
    extends: ["plugin:next/recommended"],
    ignores: [".next/**", "out/**", "build/**", "node_modules/**"],
  },
]);
