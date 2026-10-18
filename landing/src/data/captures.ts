import type { ImageMetadata } from "astro";
import annotations from "./annotations.json";

const images = import.meta.glob<{ default: ImageMetadata }>("../assets/*.png", { eager: true });
export const capture = (name: string, mode: "light" | "dark") => {
  const image = images[`../assets/${name}-${mode}.png`]?.default;
  if (!image) throw new Error(`Missing playground capture: ${name}-${mode}`);
  return image;
};

export interface Mark {
  label: string;
  x: number;
  y: number;
}
// Pairs labels with the boxes measured by playground/scripts/capture-landing.ts.
export const marks = (name: keyof typeof annotations, labels: string[]): Mark[] => {
  const boxes = annotations[name];
  if (boxes.length !== labels.length) throw new Error(`Annotation count mismatch: ${name}`);
  return boxes.map(({ x, y }, index) => ({ label: labels[index], x, y }));
};
