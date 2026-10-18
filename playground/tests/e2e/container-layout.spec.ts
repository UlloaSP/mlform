import { expect, test } from "@playwright/test";
import { execute, menu, preview, ready } from "./code-workspace-helpers.ts";

test("group columns follow the form container in every layout", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/#code-lab");
  await ready(page);
  await page.getByLabel("Code position").selectOption("top");
  await execute(
    page,
    `import { mountForm } from "mlform";
const parent = document.querySelector("#form")!;
for (const kind of ["stacked", "split", "tabs", "wizard"] as const) {
  const container = document.createElement("div");
  container.className = "fixture";
  container.style.cssText = "width:420px;max-width:none;height:auto;margin-bottom:20px";
  parent.append(container);
  const children = [{ kind: "group", columns: 3, children: ["a", "b", "c"].map(field => ({kind:"field", field})) }];
  const panel = { title: "Inputs", children };
  mountForm(container, {
    schema: { fields: ["a", "b", "c"].map(id => ({id, kind:"number", label:id, defaultValue:1})) },
    layout: kind === "tabs" ? {kind, tabs:[panel]} : kind === "wizard" ? {kind, steps:[panel]} : {kind, children},
    transport: {submit: async () => ({reports:[]})},
  });
}`,
  );
  await ready(page);
  const groups = preview(page).locator(".group.columns-3");
  await expect(groups).toHaveCount(4);
  const columns = () =>
    groups.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length),
    );
  await expect.poll(columns).toEqual([1, 1, 1, 1]);
  await preview(page)
    .locator(".fixture")
    .evaluateAll((elements) =>
      elements.forEach((element) => ((element as HTMLElement).style.width = "1200px")),
    );
  await expect.poll(columns).toEqual([3, 3, 3, 3]);
  await page.setViewportSize({ width: 700, height: 1000 });
  await expect.poll(columns).toEqual([3, 3, 3, 3]);
});

for (const mode of ["light", "dark"]) {
  test(`regressor interval labels stay contained and readable in ${mode}`, async ({ page }) => {
    await page.goto("/#code-lab");
    await ready(page);
    await menu(page).click();
    await page.getByLabel("Design system").selectOption("eshkra");
    await page.getByLabel("Appearance").selectOption(mode);
    await menu(page).click();
    await execute(
      page,
      `import { mountForm } from "mlform";
const container = document.querySelector<HTMLElement>("#form")!;
container.style.cssText = "width:300px;max-width:none;height:auto";
const mounted = mountForm(container, {
  schema: {fields: [], reports: [{id:"estimate", kind:"regressor", label:"Estimate", mappedTo:"estimate", unit:"milligrams per litre", precision:6}]},
  transport: {submit: async () => ({reports:[{backend:"default", mappedTo:"estimate", status:"ready", payload:{values:[12345, 12346], interval:[10000, 15000]}}]})},
});
await mounted.submit();`,
    );
    await ready(page);
    const report = preview(page).locator("mlf-regressor-report");
    const labels = report.locator(".limit-label");
    await expect(labels).toHaveCount(4);
    await expect(preview(page).locator("mlf-form")).toHaveAttribute(
      "data-mlf-effective-scheme",
      mode,
    );
    const contrast = await report.evaluate((element) => {
      const label = element.shadowRoot!.querySelector(".limit-label")!;
      const surface = (element.getRootNode() as ShadowRoot).querySelector(".report")!;
      const luminance = (color: string) => {
        const [r, g, b] = color
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number)
          .map((value) => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          });
        return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
      };
      const foreground = luminance(getComputedStyle(label).color);
      const background = luminance(getComputedStyle(surface).backgroundColor);
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    const bounds = await report.boundingBox();
    expect(bounds).not.toBeNull();
    for (const label of await labels.all()) {
      const numberLines = await label.evaluate((element) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();
        while (node && !node.textContent?.trim()) node = walker.nextNode();
        const number = /\S+/.exec(node!.textContent!)!;
        const range = document.createRange();
        range.setStart(node!, number.index);
        range.setEnd(node!, number.index + number[0].length);
        return range.getClientRects().length;
      });
      expect(numberLines).toBe(1);
      const box = (await label.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(bounds!.x - 1);
      expect(box.x + box.width).toBeLessThanOrEqual(bounds!.x + bounds!.width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(bounds!.y + bounds!.height + 1);
    }
    const items = report.locator(".item");
    const first = (await items.nth(0).boundingBox())!;
    const lastLabel = (await labels.nth(1).boundingBox())!;
    expect(lastLabel.y + lastLabel.height).toBeLessThanOrEqual(first.y + first.height + 1);
  });
}
