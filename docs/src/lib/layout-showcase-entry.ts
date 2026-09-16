import { mountLayoutShowcase } from "./layout-showcase-live.ts";

for (const root of document.querySelectorAll("[data-layout-showcase]")) {
  if (!(root instanceof HTMLElement)) {
    continue;
  }

  mountLayoutShowcase(root);
}
