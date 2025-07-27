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
      dts({
        tsconfigPath: "tsconfig.build.json",
        entryRoot: "src",
        outDir: "dist/types",
        insertTypesEntry: false,
      }),
      visualizer({
        filename: "stats/stats_lib.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: "treemap",
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
  };
});
