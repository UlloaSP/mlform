import { chromium, expect, type Browser, type FrameLocator, type Page } from "@playwright/test";

// Shared by the landing and documentation captures: both run real code in the playground code lab.
export type Box = { x: number; y: number; width: number; height: number };
export type Mode = "light" | "dark";
export interface CaptureContext {
  page: Page;
  preview: FrameLocator;
  shoot: (file: string, selectors?: string[]) => Promise<Box>;
}
export interface CaptureExample {
  name: string;
  code: string;
  capture?: (context: CaptureContext) => Promise<void>;
  /** Taller captures need a taller window: screenshots are clipped to the viewport. */
  viewport?: { width: number; height: number };
}

const origin = process.env.PLAYGROUND_URL ?? "http://127.0.0.1:10001";

export const union = async (preview: FrameLocator, selectors: string[]): Promise<Box> => {
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

// A layout capture must show the whole form: any scrolled region would hide part of it.
export const scrolledRegions = (preview: FrameLocator) =>
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
    // The pages frame every capture themselves, so the preview page stays transparent.
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

const captureExample = async (
  browser: Browser,
  mode: Mode,
  assetDirectory: string,
  { name, code, capture, viewport = { width: 1920, height: 1200 } }: CaptureExample,
) => {
  const page = await browser.newPage({
    viewport,
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
  await expect(page.locator(".code-status")).not.toHaveText("Updating…");
  // A failed run names its error, so a broken example is diagnosable from the console.
  expect(await page.locator(".code-error").textContent(), name).toBe("");
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
};

export const captureExamples = async (assetDirectory: string, examples: CaptureExample[]) => {
  const browser = await chromium.launch();
  try {
    for (const mode of ["light", "dark"] as const) {
      for (const example of examples) {
        await captureExample(browser, mode, assetDirectory, example);
      }
    }
  } finally {
    await browser.close();
  }
};
