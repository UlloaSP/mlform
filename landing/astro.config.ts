import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://mlform.eshkra.dev",
  trailingSlash: "always",
  devToolbar: { enabled: false },
  vite: {
    // The dev server must read the shared brand fonts outside this standalone workspace.
    server: {
      fs: {
        allow: [
          fileURLToPath(new URL(".", import.meta.url)),
          fileURLToPath(new URL("../brand", import.meta.url)),
        ],
      },
    },
  },
});
