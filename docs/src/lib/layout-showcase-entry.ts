import { mountLayoutShowcase } from "./layout-showcase-live";

for (const root of document.querySelectorAll<HTMLElement>("[data-layout-showcase]")) {
  mountLayoutShowcase(root);
}
