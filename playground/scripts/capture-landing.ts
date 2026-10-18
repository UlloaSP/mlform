import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, expect, type FrameLocator, type Page } from "@playwright/test";
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
const origin = process.env.PLAYGROUND_URL ?? "http://127.0.0.1:10001";
type Box = { x: number; y: number; width: number; height: number };
interface Context {
  page: Page;
  preview: FrameLocator;
  shoot: (file: string, selectors?: string[]) => Promise<Box>;
}
interface Example {
  name: string;
  code: string;
  capture?: (context: Context) => Promise<void>;
}
const frame = (id: string) => `mlf-field-frame[data-field-id="${id}"]`;
const annotations: Record<string, Box[]> = {};
let onehotColumns: { label: string; target: string; value: unknown }[] = [];

const examples: Example[] = [
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
    async capture({ preview, shoot }: Context) {
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

const union = async (preview: FrameLocator, selectors: string[]): Promise<Box> => {
  const boxes = await Promise.all(
    selectors.map(async (selector) => (await preview.locator(selector).first().boundingBox())!),
  );
  const x = Math.min(...boxes.map((box) => box.x));
  const y = Math.min(...boxes.map((box) => box.y));
  return {
    x,
    y,
    width: Math.max(...boxes.map((box) => box.x + box.width)) - x,
    height: Math.max(...boxes.map((box) => box.y + box.height)) - y,
  };
};
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
// A layout capture must show the whole form: any scrolled region would hide part of it.
const scrolledRegions = (preview: FrameLocator) =>
  preview.locator("#form").evaluate((form) => {
    const found: string[] = [];
    const roots: (Element | ShadowRoot)[] = [form];
    while (roots.length) {
      for (const node of roots.pop()!.querySelectorAll("*")) {
        if (node.scrollHeight > node.clientHeight + 1 || node.scrollWidth > node.clientWidth + 1) {
          const style = getComputedStyle(node);
          if (style.overflowX !== "visible" || style.overflowY !== "visible") {
            found.push(`${node.tagName.toLowerCase()}.${node.className}`);
          }
        }
        if (node.shadowRoot) roots.push(node.shadowRoot);
      }
    }
    return found;
  });
const settle = async (preview: FrameLocator) => {
  await preview.locator("#form").evaluate(async (element) => {
    // The landing frames every capture itself, so the preview page stays transparent.
    element.ownerDocument.body.style.background = "transparent";
    await element.ownerDocument.fonts.ready;
    const roots: (Element | ShadowRoot)[] = [element];
    while (roots.length) {
      for (const child of roots.pop()!.querySelectorAll<HTMLElement>("*")) {
        if ("updateComplete" in child) await child.updateComplete;
        if (child.shadowRoot) roots.push(child.shadowRoot);
      }
    }
  });
};

await mkdir(assetDirectory, { recursive: true });
const browser = await chromium.launch();
try {
  for (const mode of ["light", "dark"] as const) {
    for (const { name, code, capture } of examples) {
      const page = await browser.newPage({
        viewport: { width: 1920, height: 1200 },
        deviceScaleFactor: 2,
        colorScheme: mode,
        reducedMotion: "reduce",
      });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(
        ({ mode, code }) => {
          if (window !== window.top) return;
          localStorage.setItem(
            "mlform-playground-design",
            JSON.stringify({ theme: "eshkra", recipe: "default", mode }),
          );
          localStorage.setItem(
            "mlform-code-workspace",
            JSON.stringify({ code, position: "left", ratio: 20, exampleId: "basic" }),
          );
        },
        { mode, code },
      );
      await page.goto(`${origin}/#code-lab`);
      await expect(page.locator(".code-status")).toHaveText("Up to date");
      const preview = page.frameLocator('iframe[title="MLForm code preview"]');
      await page.locator('iframe[title="MLForm code preview"]').evaluate((iframe: HTMLElement) => {
        for (let node: HTMLElement | null = iframe; node; node = node.parentElement) {
          node.style.background = "transparent";
        }
      });
      await settle(preview);
      const shoot = async (file: string, selectors = ["#form"]) => {
        await settle(preview);
        // Aligning the first target to the top keeps multi-element captures inside the viewport.
        await preview
          .locator(selectors[0])
          .first()
          .evaluate((element) => element.scrollIntoView({ block: "start" }));
        const box = await union(preview, selectors);
        await page.screenshot({
          path: `${assetDirectory}${file}-${mode}.png`,
          // One extra pixel keeps anti-aliased frame borders inside the capture.
          clip: { x: box.x - 1, y: box.y - 1, width: box.width + 2, height: box.height + 2 },
          omitBackground: true,
          animations: "disabled",
        });
        return box;
      };
      await (capture ?? (({ shoot }) => shoot(name).then(() => {})))({ page, preview, shoot });
      expect(errors).toEqual([]);
      console.log(`Captured ${name} in ${mode} mode.`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
await writeFile(dataFile("annotations"), json(annotations));
await writeFile(dataFile("onehot"), json(onehotColumns));
