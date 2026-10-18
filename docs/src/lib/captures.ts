import type { ImageMetadata } from "astro";

type Module = { default: ImageMetadata };

// Documentation captures come from playground/scripts/capture-docs.ts. Screens shared with the
// landing (fields, layouts, plugins, backends) are read from its assets instead of being copied.
const docs = import.meta.glob<Module>("../assets/captures/*.png", { eager: true });
const landing = import.meta.glob<Module>("../../../landing/src/assets/*.png", { eager: true });

const byName = new Map<string, ImageMetadata>(
  Object.entries({ ...landing, ...docs }).map(([path, module]) => [
    path.slice(path.lastIndexOf("/") + 1, -".png".length),
    module.default,
  ]),
);

export const capture = (name: string, mode: "light" | "dark"): ImageMetadata => {
  const image = byName.get(`${name}-${mode}`);
  if (!image) throw new Error(`Missing ${mode} capture "${name}".`);
  return image;
};
