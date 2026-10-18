import { defineConfig } from "vite";
import { API_ROUTES } from "./server/api-routes.js";

// Keep public model calls on the playground's origin.
const proxy = Object.fromEntries(
  API_ROUTES.map(({ prefix, target }) => [
    prefix,
    {
      target,
      changeOrigin: true,
      rewrite: (path) => path.slice(prefix.length),
    },
  ]),
);

export default defineConfig({ server: { proxy }, preview: { proxy } });
