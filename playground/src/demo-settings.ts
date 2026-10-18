import { builtinDesignSystemRegistry } from "mlform/design";

export const DESIGN_STORAGE_KEY = "mlform-playground-design";
export const VIEWPORT_STORAGE_KEY = "mlform-playground-viewport";
export const THEMES = builtinDesignSystemRegistry.listThemes();
export const RECIPES = builtinDesignSystemRegistry.listRecipes();
export const MODES = [
  { id: "auto", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];
export const VIEWPORTS = [
  { id: "actual", label: "Current viewport" },
  { id: "phone", label: "Phone · 390 × 844", width: 390, height: 844 },
  { id: "tablet", label: "Tablet · 820 × 1180", width: 820, height: 1180 },
  { id: "laptop", label: "Laptop · 1366 × 768", width: 1366, height: 768 },
  { id: "pc", label: "PC · 1920 × 1080", width: 1920, height: 1080 },
  { id: "ultrawide", label: "Ultrawide · 2560 × 1080", width: 2560, height: 1080 },
  { id: "custom", label: "Custom" },
];
export const SIZE_LIMITS = { width: [1, 8192], height: [1, 8192] } as const;
export interface Viewport {
  id: string;
  customWidth: number;
  customHeight: number;
}
export interface PlaygroundDesign {
  theme: string;
  recipe: string;
  mode: "auto" | "light" | "dark";
}
const readSaved = (key: string): Record<string, unknown> => {
  const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "null");
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
};

export const validSize = (value: unknown, [min, max]: readonly [number, number]): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

export const readViewport = (): Viewport => {
  try {
    const saved = readSaved(VIEWPORT_STORAGE_KEY);
    return {
      id: VIEWPORTS.find(({ id }) => id === saved.id)?.id ?? "actual",
      customWidth: validSize(saved?.customWidth, SIZE_LIMITS.width) ? saved.customWidth : 1280,
      customHeight: validSize(saved?.customHeight, SIZE_LIMITS.height) ? saved.customHeight : 800,
    };
  } catch {
    return { id: "actual", customWidth: 1280, customHeight: 800 };
  }
};

export const getViewportSize = (viewport: Viewport) => {
  if (viewport.id === "custom")
    return { width: viewport.customWidth, height: viewport.customHeight };
  const preset = VIEWPORTS.find(({ id }) => id === viewport.id);
  if (!preset?.width || !preset.height)
    throw new Error("Select a simulated viewport before requesting its dimensions.");
  return { width: preset.width, height: preset.height };
};

export const readDesignSystem = (): PlaygroundDesign => {
  try {
    const saved = readSaved(DESIGN_STORAGE_KEY);
    return {
      theme: THEMES.find(({ id }) => id === saved.theme)?.id ?? "eshkra",
      recipe: RECIPES.find(({ id }) => id === saved.recipe)?.id ?? "default",
      mode: saved.mode === "light" || saved.mode === "dark" ? saved.mode : "auto",
    };
  } catch {
    return { theme: "eshkra", recipe: "default", mode: "auto" };
  }
};
