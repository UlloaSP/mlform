import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { fileURLToPath } from "node:url";
import { redirects, sidebar } from "./src/navigation";

const repo = (path: string) =>
  fileURLToPath(new URL(`../${path}`, import.meta.url)).replaceAll("\\", "/");

export default defineConfig({
  site: "https://docs.mlform.eshkra.dev",
  trailingSlash: "always",
  devToolbar: { enabled: false },
  redirects,
  vite: {
    // Examples import the package surfaces by name; the docs build them from the library source.
    resolve: {
      alias: [
        { find: /^mlform$/, replacement: repo("src/kit/index.ts") },
        { find: /^mlform\/(\w+)$/, replacement: `${repo("src")}/$1/index.ts` },
        { find: /^@\//, replacement: `${repo("src")}/` },
      ],
    },
    // The docs read the library, the shared brand, and the captures and examples the landing uses.
    server: {
      fs: {
        allow: [
          fileURLToPath(new URL(".", import.meta.url)),
          repo("src"),
          repo("brand"),
          repo("landing/src/assets"),
          repo("playground/scripts"),
          repo("node_modules"),
        ],
      },
    },
  },
  integrations: [
    starlight({
      title: "MLForm",
      description: "Schema-driven interfaces for machine-learning models.",
      components: {
        Head: "./src/components/BrandHead.astro",
        SiteTitle: "./src/components/BrandTitle.astro",
        SocialIcons: "./src/components/SocialIcons.astro",
        Footer: "./src/components/Footer.astro",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/UlloaSP/mlform",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/UlloaSP/mlform/edit/main/docs/",
      },
      expressiveCode: {
        // The same code themes as the landing, switched with the documentation theme.
        themes: ["github-dark-default", "github-light-default"],
        styleOverrides: {
          borderRadius: "12px",
          borderColor: "var(--mf-border)",
          codeFontFamily: "var(--brand-font-mono)",
          uiFontFamily: "var(--brand-font-sans)",
          codeFontSize: "0.8125rem",
          codeLineHeight: "1.7",
          frames: {
            shadowColor: "transparent",
            editorTabBarBackground: "var(--mf-subtle)",
            editorActiveTabBackground: "var(--mf-code-bg)",
            editorActiveTabIndicatorTopColor: "var(--mf-ember)",
            editorActiveTabIndicatorBottomColor: "transparent",
            editorBackground: "var(--mf-code-bg)",
            terminalTitlebarBackground: "var(--mf-subtle)",
            terminalBackground: "var(--mf-code-bg)",
          },
        },
      },
      customCss: [
        "../brand/typography.css",
        "./src/styles/theme.css",
        "./src/styles/content.css",
        "./src/styles/figures.css",
      ],
      sidebar,
    }),
  ],
});
