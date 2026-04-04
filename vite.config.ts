// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(() => {
  return {
    build: {
      lib: {
        entry: {
          mlform: resolve(__dirname, "src/mlform/index.ts"),
          "mlform/extensions": resolve(__dirname, "src/extensions/index.ts"),
          "mlform/strategies": resolve(__dirname, "src/strategies/index.ts"),
        },
        name: "mlform",
        formats: ["es"],
        fileName: (_, mnt) => `${mnt}.mjs`,
      },
      outDir: "dist",
      emptyOutDir: true,
      minify: "esbuild",
      rollupOptions: {
        treeshake: {
          moduleSideEffects: false,
        },
      },
    },
    plugins: [
      dts(),
      visualizer({
        filename: "stats/bundle_size_treemap.html",
        gzipSize: true,
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
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
        exclude: [
          "node_modules/",
          "test/",
          "dist/",
          "**/*.d.ts",
          "**/*.config.*",
          "**/coverage/**",
        ],
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
  };
});
