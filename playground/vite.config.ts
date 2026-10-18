import { defineConfig } from "vite";
import { API_ROUTES } from "./server/api-routes.ts";
import { fileURLToPath } from "node:url";

// Keep public model calls on the playground's origin.
const proxy = Object.fromEntries(
  API_ROUTES.map(({ prefix, target }) => [
    prefix,
    {
      target,
      changeOrigin: true,
      rewrite: (path: string) => path.slice(prefix.length),
    },
  ]),
);

// The code preview has an opaque origin; public module assets must accept its CORS requests.
const cors = { origin: ["null", /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/] };

export default defineConfig({
  server: { proxy, cors },
  preview: { proxy, cors },
  build: {
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL("./index.html", import.meta.url)),
        code: fileURLToPath(new URL("./code-preview.html", import.meta.url)),
      },
    },
  },
});
