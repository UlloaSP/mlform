import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["src/**/*.{ts}"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  {
    files: ["src/**/*.{ts}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  ...tseslint.config(
    js.configs.recommended,
    tseslint.configs.recommended,
    { files: ["src/**/*.ts"] }
  ),
]);
