import type { Demo } from "./demo-types.ts";
import { mountFormulationDemo } from "./formulation-demo/index.ts";
import { mountPlayground, mountTabsPlayground, mountWizardPlayground } from "./playground/index.ts";
import { mountFieldCombinationsPlayground } from "./playground/field-combinations.ts";
import { mountLab2Pressure } from "./clinical-demos/lab2pressure.ts";
import { mountDoseTailor } from "./clinical-demos/dosetailor.ts";
import { mountCodeWorkspace } from "./code-workspace/lazy.ts";

export const DEMOS: Demo[] = [
  {
    id: "formulation-kit",
    label: "M3DISEEN",
    group: "Examples",
    mount: (container, designSystem) => mountFormulationDemo(container, designSystem),
  },
  {
    id: "lab2pressure-lite",
    label: "Lab2pressure/lite",
    group: "Examples",
    mount: mountLab2Pressure,
  },
  { id: "dosetailor", label: "DoseTailor", group: "Examples", mount: mountDoseTailor },
  {
    id: "playground-stacked",
    label: "Stacked",
    group: "Layouts",
    mount: (container, designSystem) =>
      mountPlayground(container, "sectioned", undefined, designSystem),
  },
  {
    id: "playground-split",
    label: "Split",
    group: "Layouts",
    mount: (container, designSystem) =>
      mountPlayground(container, "split", undefined, designSystem),
  },
  {
    id: "wizard-reports",
    label: "Wizard",
    group: "Layouts",
    mount: (container, designSystem) => mountWizardPlayground(container, designSystem),
  },
  {
    id: "tabs-classic",
    label: "Tabs",
    group: "Layouts",
    mount: (container, designSystem) => mountTabsPlayground(container, designSystem),
  },
  {
    id: "field-combinations",
    label: "Field combos",
    group: "Debug",
    mount: mountFieldCombinationsPlayground,
  },
  { id: "code-lab", label: "Editor", group: "Code", mount: mountCodeWorkspace },
];

const DEFAULT_DEMO_ID = DEMOS[0].id;
export const FIXED_LAYOUT_DEMO_IDS = new Set([
  "code-lab",
  "playground-split",
  "wizard-reports",
  "tabs-classic",
]);

export const getDemoById = (demoId: string) => DEMOS.find((demo) => demo.id === demoId) ?? DEMOS[0];

export const getRouteDemoId = () => {
  const hash = window.location.hash.replace(/^#/, "").trim();
  return DEMOS.some((demo) => demo.id === hash) ? hash : DEFAULT_DEMO_ID;
};
