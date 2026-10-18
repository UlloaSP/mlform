import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { expect, type FrameLocator } from "@playwright/test";
import {
  captureExamples,
  scrolledRegions,
  union,
  type Box,
  type CaptureContext,
  type CaptureExample,
} from "./capture-kit.ts";
import {
  fieldOverviewCode,
  invalidValue,
  onehotCode,
  onehotField,
  overviewFields,
  seriesCode,
} from "./landing/fields.ts";
import { heroCode, layoutExamples, sectionsCode } from "./landing/layouts.ts";
import { pluginCode, backendCode } from "./landing/extensions.ts";

const assetDirectory = fileURLToPath(new URL("../../landing/src/assets/", import.meta.url));
const dataFile = (name: string) =>
  fileURLToPath(new URL(`../../landing/src/data/${name}.json`, import.meta.url));
const frame = (id: string) => `mlf-field-frame[data-field-id="${id}"]`;
const annotations: Record<string, Box[]> = {};
let onehotColumns: { label: string; target: string; value: unknown }[] = [];

const examples: CaptureExample[] = [
  {
    name: "hero",
    code: heroCode,
    async capture({ page, preview, shoot }) {
      // Both report descriptions are opened through their help buttons, as a reader would.
      for (const report of await preview.locator("mlf-report-frame").all()) {
        await report.locator(".help-btn").click();
      }
      // Moving the pointer away keeps the last button out of its hover state.
      await page.mouse.move(0, 0);
      const form = await shoot("hero");
      annotations.hero = await measure(preview, form, [
        [frame("temperature")],
        [frame("location")],
        ["mlf-report-frame >> nth=0"],
        ["mlf-report-frame >> nth=1"],
      ]);
    },
  },
  {
    name: "fields",
    code: fieldOverviewCode,
    async capture({ preview, shoot }) {
      const input = preview.locator(`${frame("invalid")} input`);
      await input.fill(invalidValue);
      await input.blur();
      for (const { id } of overviewFields) {
        if (id === "readings") continue;
        // A mapped category is only meaningful next to the field its options update.
        const selectors = id === "mapped-category" ? [frame(id), frame("readings")] : [frame(id)];
        await shoot(`field-${id}`, selectors);
      }
    },
  },
  {
    name: "onehot",
    code: onehotCode,
    async capture({ preview, shoot }) {
      await shoot("onehot", [frame(onehotField.id)]);
      // Printed beside the capture: the exact columns the transport received.
      const payload = await preview
        .locator("body")
        .evaluate((body) => JSON.parse(body.dataset.payload ?? "{}") as Record<string, unknown>);
      onehotColumns = onehotField.options.map(({ label, mappedTo }) => ({
        label,
        target: mappedTo,
        value: payload[mappedTo],
      }));
      expect(Object.keys(payload).toSorted()).toEqual(
        onehotColumns.map(({ target }) => target).toSorted(),
      );
    },
  },
  {
    name: "series",
    code: seriesCode,
    capture: ({ shoot }) => shoot("series", [frame("readings")]).then(() => {}),
  },
  ...layoutExamples.map((example) => ({
    ...example,
    async capture({ preview, shoot }: CaptureContext) {
      // The second wizard step shows the progress indicator and validated navigation.
      if (example.name === "layout-wizard") {
        await preview.getByRole("button", { name: "Next", exact: true }).click();
      }
      await shoot(example.name);
      expect(await scrolledRegions(preview), example.name).toEqual([]);
    },
  })),
  {
    name: "sections",
    code: sectionsCode,
    async capture({ preview, shoot }) {
      const form = await shoot("sections");
      annotations.sections = await measure(preview, form, [
        [frame("station"), frame("observed")],
        [frame("temperature"), frame("humidity"), frame("wind")],
        ['button[aria-expanded="false"]'],
      ]);
    },
  },
  { name: "plugin", code: pluginCode },
  { name: "backends", code: backendCode },
];

// Annotation boxes are stored relative to the capture so the landing can scale them freely.
const measure = (preview: FrameLocator, form: Box, targets: string[][]) =>
  Promise.all(
    targets.map(async (selectors) => {
      const box = await union(preview, selectors);
      const round = (value: number) => Math.round(value * 10000) / 10000;
      return {
        x: round((box.x - form.x) / form.width),
        y: round((box.y - form.y) / form.height),
        width: round(box.width / form.width),
        height: round(box.height / form.height),
      };
    }),
  );

await mkdir(assetDirectory, { recursive: true });
await captureExamples(assetDirectory, examples);
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
await writeFile(dataFile("annotations"), json(annotations));
await writeFile(dataFile("onehot"), json(onehotColumns));
