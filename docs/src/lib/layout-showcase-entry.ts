import { mountLayoutShowcase } from "./layout-showcase-live.ts";

for (const root of document.querySelectorAll("[data-layout-showcase-locale]")) {
  if (!(root instanceof HTMLElement)) {
    continue;
  }

  const locale = root.dataset.layoutShowcaseLocale === "es" ? "es" : "en";
  mountLayoutShowcase(root, locale);
}
