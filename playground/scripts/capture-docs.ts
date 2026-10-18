import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { expect } from "@playwright/test";
import { captureExamples, scrolledRegions, type CaptureExample } from "./capture-kit.ts";
import { recipesCode, themesCode } from "./docs/design.ts";
import {
  conditionsCode,
  fieldStatesCode,
  reportStatesCode,
  submitErrorCode,
  wizardCode,
} from "./docs/states.ts";

// Documentation-only captures. Shared screenshots (fields, layouts, plugins) come from the landing.
const assetDirectory = fileURLToPath(new URL("../../docs/src/assets/captures/", import.meta.url));

// The headless shell is shown verbatim in the docs; its host-owned CSS is not part of the lesson.
const shellStyles = `
  .station-card { display: grid; grid-template-columns: 1fr 260px; gap: 16px 20px; width: 760px;
    padding: 22px; border: 1px solid var(--mlf-color-border); border-radius: 14px;
    background: var(--mlf-color-surface); color: var(--mlf-color-text); font-family: var(--brand-font-sans); }
  .station-card header { grid-column: 1 / -1; }
  .station-card h2 { margin: 0; font-size: 20px; }
  .station-card header p { margin: 4px 0 0; color: var(--mlf-color-text-muted); font-size: 14px; }
  .station-card .readings { display: grid; gap: 12px; }
  .station-card footer { grid-column: 1 / -1; display: flex; justify-content: end; }
  .station-card button { padding: 10px 18px; border: 0; border-radius: 999px; font: 600 14px var(--brand-font-sans);
    background: var(--mlf-color-accent); color: var(--mlf-color-text-inverse); }`;
const shellCode = `const style = document.head.appendChild(document.createElement("style"));
style.textContent = ${JSON.stringify(shellStyles)};
${readFileSync(new URL("./docs/headless-shell.ts", import.meta.url), "utf8")}`;

// The quick start runs verbatim inside a container with the id its code expects.
const quickStartCode = `const host = document.querySelector<HTMLElement>("#form")!;
host.style.width = "520px";
host.appendChild(document.createElement("div")).id = "forecast-form";
${readFileSync(new URL("./docs/quick-start.ts", import.meta.url), "utf8")}`;

const examples: CaptureExample[] = [
  {
    name: "quick-start",
    code: quickStartCode,
    async capture({ page, preview, shoot }) {
      await preview.getByRole("button", { name: "Run forecast" }).click();
      await expect(preview.locator("mlf-report-frame")).toContainText("22.1 °C");
      await page.mouse.move(0, 0);
      await shoot("quick-start");
    },
  },
  { name: "field-states", code: fieldStatesCode },
  {
    name: "wizard-blocked",
    code: wizardCode,
    async capture({ preview, shoot }) {
      // Next validates only the current step, so its empty required fields report errors.
      await preview.getByRole("button", { name: "Next", exact: true }).click();
      await expect(preview.locator("mlf-field-frame[data-field-id='station']")).toBeVisible();
      await shoot("wizard-blocked");
    },
  },
  {
    name: "report-states",
    code: reportStatesCode,
    async capture({ preview, shoot }) {
      await shoot("report-states");
      expect(await scrolledRegions(preview)).toEqual([]);
    },
  },
  { name: "submit-error", code: submitErrorCode },
  { name: "conditions", code: conditionsCode },
  { name: "themes", code: themesCode, viewport: { width: 1920, height: 2000 } },
  { name: "recipes", code: recipesCode },
  {
    name: "headless-shell",
    code: shellCode,
    async capture({ page, preview, shoot }) {
      await preview.getByRole("button", { name: "Run forecast" }).click();
      await expect(preview.locator("mlf-report-frame")).toContainText("22.66");
      await page.mouse.move(0, 0);
      await shoot("headless-shell", [".station-card"]);
    },
  },
];

await mkdir(assetDirectory, { recursive: true });
// CAPTURE_ONLY=quick-start,themes regenerates a subset while editing one page.
const only = process.env.CAPTURE_ONLY?.split(",");
await captureExamples(
  assetDirectory,
  examples.filter(({ name }) => !only || only.includes(name)),
);
