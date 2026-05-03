// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import dts from "vite-plugin-dts";
import { defineConfig } from "vite-plus";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  build: {
    lib: {
      entry: {
        mlform: resolve(rootDir, "src/index.ts"),
        "mlform/runtime": resolve(rootDir, "src/runtime/index.ts"),
        "mlform/schema": resolve(rootDir, "src/schema/index.ts"),
        "mlform/presentation": resolve(rootDir, "src/presentation/index.ts"),
        "mlform/builtins-ml": resolve(rootDir, "src/builtins-ml/index.ts"),
        "mlform/behaviors": resolve(rootDir, "src/behaviors/index.ts"),
        "mlform/primitives": resolve(rootDir, "src/primitives/index.ts"),
        "mlform/design-system": resolve(rootDir, "src/design-system/index.ts"),
        "mlform/kit": resolve(rootDir, "src/kit/index.ts"),
        "mlform/transport": resolve(rootDir, "src/transport/index.ts"),
      },
      name: "mlform",
      formats: ["es"],
      fileName: (_, mnt) => `${mnt}.mjs`,
    },
    outDir: "dist",
    emptyOutDir: true,
    minify: "oxc",
  },
  plugins: [
    dts({
      entryRoot: "src",
      include: ["src/**/*.ts"],
      outDir: "dist/types",
      tsconfigPath: "./tsconfig.build.json",
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      mlform: resolve(rootDir, "src/index.ts"),
      "mlform/runtime": resolve(rootDir, "src/runtime/index.ts"),
      "mlform/schema": resolve(rootDir, "src/schema/index.ts"),
      "mlform/presentation": resolve(rootDir, "src/presentation/index.ts"),
      "mlform/builtins-ml": resolve(rootDir, "src/builtins-ml/index.ts"),
      "mlform/behaviors": resolve(rootDir, "src/behaviors/index.ts"),
      "mlform/design-system": resolve(rootDir, "src/design-system/index.ts"),
      "mlform/kit": resolve(rootDir, "src/kit/index.ts"),
      "mlform/primitives": resolve(rootDir, "src/primitives/index.ts"),
      "mlform/transport": resolve(rootDir, "src/transport/index.ts"),
    },
  },
  define: {
    __DEV__: process.env.NODE_ENV !== "production",
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts"],
    coverage: {
      reporter: ["html"],
      exclude: ["node_modules/", "test/", "dist/", "**/*.d.ts", "**/*.config.*", "**/coverage/**"],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    typecheck: {
      include: ["test/**/*.test.ts"],
    },
  },
});
