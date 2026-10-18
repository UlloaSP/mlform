import { builtinDesignSystemRegistry } from "mlform/design";
import { PLAYGROUND_DESIGN_SYSTEM } from "./playground/config.js";

export const DESIGN_STORAGE_KEY = "mlform-playground-design";
export const VIEWPORT_STORAGE_KEY = "mlform-playground-viewport";
export const THEMES = builtinDesignSystemRegistry.listThemes();
export const RECIPES = builtinDesignSystemRegistry.listRecipes();
export const MODES = [
  { id: "light", label: "Claro" },
  { id: "dark", label: "Oscuro" },
];
export const VIEWPORTS = [
  { id: "actual", label: "Pantalla actual" },
  { id: "phone", label: "Phone · 390 × 844", width: 390, height: 844 },
  { id: "tablet", label: "Tablet · 820 × 1180", width: 820, height: 1180 },
  { id: "laptop", label: "Laptop · 1366 × 768", width: 1366, height: 768 },
  { id: "pc", label: "PC · 1920 × 1080", width: 1920, height: 1080 },
  { id: "ultrawide", label: "Ultrawide · 2560 × 1080", width: 2560, height: 1080 },
  { id: "custom", label: "Personalizado" },
];
export const SIZE_LIMITS = { width: [1, 8192], height: [1, 8192] };

export const validSize = (value, [min, max]) =>
  Number.isInteger(value) && value >= min && value <= max;

export const readViewport = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(VIEWPORT_STORAGE_KEY) ?? "null");
    return {
      id: VIEWPORTS.some(({ id }) => id === saved?.id) ? saved.id : "actual",
      customWidth: validSize(saved?.customWidth, SIZE_LIMITS.width) ? saved.customWidth : 1280,
      customHeight: validSize(saved?.customHeight, SIZE_LIMITS.height) ? saved.customHeight : 800,
    };
  } catch {
    return { id: "actual", customWidth: 1280, customHeight: 800 };
  }
};

export const getViewportSize = (viewport) =>
  viewport.id === "custom"
    ? { width: viewport.customWidth, height: viewport.customHeight }
    : VIEWPORTS.find(({ id }) => id === viewport.id);

export const readDesignSystem = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(DESIGN_STORAGE_KEY) ?? "null");
    return {
      theme: THEMES.some(({ id }) => id === saved?.theme)
        ? saved.theme
        : PLAYGROUND_DESIGN_SYSTEM.theme,
      recipe: RECIPES.some(({ id }) => id === saved?.recipe)
        ? saved.recipe
        : PLAYGROUND_DESIGN_SYSTEM.recipe,
      mode: MODES.some(({ id }) => id === saved?.mode) ? saved.mode : PLAYGROUND_DESIGN_SYSTEM.mode,
    };
  } catch {
    return { ...PLAYGROUND_DESIGN_SYSTEM };
  }
};
