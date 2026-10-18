import { mountFormulationDemo } from "./formulation-demo/index.js";
import {
  mountFieldCombinationsPlayground,
  mountPlayground,
  mountTabsPlayground,
  mountWizardPlayground,
} from "./playground/index.js";
import { mountSeriesPlayground } from "./playground/series.js";
import { mountLab2Pressure } from "./clinical-demos/lab2pressure.js";
import { mountDoseTailor } from "./clinical-demos/dosetailor.js";

export const DEMOS = [
  {
    id: "formulation-kit",
    label: "M3DISEEN",
    mount: (container, designSystem) => mountFormulationDemo(container, designSystem),
  },
  { id: "lab2pressure-lite", label: "Lab2pressure/lite", mount: mountLab2Pressure },
  { id: "dosetailor", label: "DoseTailor", mount: mountDoseTailor },
  {
    id: "playground-stacked",
    label: "Stacked",
    mount: (container, designSystem) =>
      mountPlayground(container, "sectioned", undefined, designSystem),
  },
  {
    id: "playground-split",
    label: "Split",
    mount: (container, designSystem) =>
      mountPlayground(container, "split", undefined, designSystem),
  },
  {
    id: "field-combinations",
    label: "Field combos",
    mount: (container, designSystem) => mountFieldCombinationsPlayground(container, designSystem),
  },
  {
    id: "wizard-reports",
    label: "Wizard",
    mount: (container, designSystem) => mountWizardPlayground(container, designSystem),
  },
  {
    id: "series",
    label: "Series",
    mount: (container, designSystem) => mountSeriesPlayground(container, designSystem),
  },
  {
    id: "tabs-classic",
    label: "Tabs",
    mount: (container, designSystem) => mountTabsPlayground(container, designSystem),
  },
];

const DEFAULT_DEMO_ID = DEMOS[0].id;
export const FIXED_LAYOUT_DEMO_IDS = new Set([
  "playground-split",
  "field-combinations",
  "wizard-reports",
  "tabs-classic",
]);

export const getDemoById = (demoId) => DEMOS.find((demo) => demo.id === demoId) ?? DEMOS[0];

export const getRouteDemoId = () => {
  const hash = window.location.hash.replace(/^#/, "").trim();
  return DEMOS.some((demo) => demo.id === hash) ? hash : DEFAULT_DEMO_ID;
};
