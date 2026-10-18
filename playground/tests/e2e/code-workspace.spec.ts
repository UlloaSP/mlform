import { expect, test } from "@playwright/test";
import { STARTER_CODE } from "../../src/code-workspace/example.ts";

import { preview, editor, menu, ready, edit, execute } from "./code-workspace-helpers.ts";

test("reset restores the start of the code after scrolling a long line", async ({ page }) => {
  await page.goto("/#code-lab");
  await ready(page);
  await edit(page, "// " + "long line ".repeat(200));
  await ready(page);
  const scroller = page.locator(".cm-scroller");
  await scroller.evaluate((element) => {
    element.scrollLeft = 500;
  });
  await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(100);
  await page.getByRole("button", { name: "Reset example" }).click();
  await expect
    .poll(() => scroller.evaluate((element) => [element.scrollLeft, element.scrollTop]))
    .toEqual([0, 0]);
  await ready(page);
});

test("menu opens an editable TypeScript example with a working local prediction", async ({
  page,
}) => {
  await page.goto("/#playground-stacked");
  await menu(page).click();
  await page.getByRole("menuitemradio", { name: "Editor", exact: true }).click();
  await expect(page).toHaveURL(/#code-lab$/);
  await ready(page);
  const input = preview(page).getByRole("spinbutton", { name: "Hours per week" });
  await expect(input).toHaveValue("5");
  await input.fill("7");
  await preview(page).getByRole("button", { name: "Submit", exact: true }).click();
  await expect(preview(page).getByRole("region", { name: "Hours in four weeks" })).toHaveText(
    "28.00 h",
  );
  await execute(
    page,
    STARTER_CODE.replace("Hours per week", "Edited hours").replace(
      "defaultValue: 5",
      "defaultValue: 9",
    ),
  );
  await ready(page);
  await expect(preview(page).getByRole("spinbutton", { name: "Edited hours" })).toHaveValue("9");
  await edit(
    page,
    'const label: string = "Atajo"; document.querySelector("#form")!.textContent = label;',
  );
  await expect(page.locator(".code-status")).toHaveText("Updating…");
  await editor(page).press("ControlOrMeta+Enter");
  await ready(page);
  await expect(preview(page).getByText("Atajo", { exact: true })).toBeVisible();
});

test("syntax, runtime and import errors recover; reset can be undone", async ({ page }) => {
  await page.goto("/#code-lab");
  await ready(page);
  for (const [code, error] of [
    ["", "Write an MLForm example"],
    ["const value: = ;", "Unexpected token"],
    ['throw new Error("Fallo controlado")', "Fallo controlado"],
    ['import { value } from "missing-package"; console.log(value);', "Unavailable import"],
    ['await Promise.reject(new Error("Fallo asíncrono"));', "Fallo asíncrono"],
  ]) {
    await execute(page, code!);
    await expect(page.getByRole("alert")).toContainText(error!);
    await expect(page.locator(".code-status")).toHaveText("Error");
  }
  await page.getByRole("button", { name: "Reset example" }).click();
  await ready(page);
  await expect(preview(page).getByRole("spinbutton", { name: "Hours per week" })).toHaveValue("5");
  await editor(page).press("ControlOrMeta+z");
  await expect(editor(page)).toContainText("Fallo asíncrono");
});

test("all four layouts resize by keyboard and preserve rendered input", async ({ page }) => {
  await page.goto("/#code-lab");
  await ready(page);
  const separator = page.getByRole("separator");
  const input = preview(page).getByRole("spinbutton", { name: "Hours per week" });
  await input.fill("13");
  for (const position of ["left", "right", "top", "bottom"]) {
    await page.getByLabel("Code position").selectOption(position);
    await separator.press("Enter");
    const source = (await page.locator(".code-source").boundingBox())!;
    const rendered = (await page.locator(".code-preview").boundingBox())!;
    if (position === "left") expect(source.x + source.width).toBeLessThan(rendered.x);
    if (position === "right") expect(rendered.x + rendered.width).toBeLessThan(source.x);
    if (position === "top") expect(source.y + source.height).toBeLessThan(rendered.y);
    if (position === "bottom") expect(rendered.y + rendered.height).toBeLessThan(source.y);
    await separator.press(
      position === "left"
        ? "ArrowRight"
        : position === "right"
          ? "ArrowLeft"
          : position === "top"
            ? "ArrowDown"
            : "ArrowUp",
    );
    await expect(separator).toHaveAttribute("aria-valuenow", "52");
    await separator.press("Home");
    await expect(separator).toHaveAttribute("aria-valuenow", "20");
    await separator.press("End");
    await expect(separator).toHaveAttribute("aria-valuenow", "80");
    await separator.press("Enter");
    await expect(input).toHaveValue("13");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await editor(page).focus();
  await page.keyboard.press("Tab");
  await expect(separator).toBeFocused();
});

test("dragging resizes the code panel and persists its size and source", async ({ page }) => {
  await page.goto("/#code-lab");
  await ready(page);
  await page.getByLabel("Code position").selectOption("top");
  const separator = page.getByRole("separator");
  const bounds = (await separator.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 40);
  await page.mouse.up();
  const size = await separator.getAttribute("aria-valuenow");
  expect(Number(size)).toBeGreaterThan(50);
  await execute(page, STARTER_CODE.replace("Hours per week", "Saved hours"));
  await ready(page);
  await page.reload();
  await ready(page);
  await expect(page.getByLabel("Code position")).toHaveValue("top");
  await expect(separator).toHaveAttribute("aria-valuenow", size!);
  await expect(preview(page).getByRole("spinbutton", { name: "Saved hours" })).toBeVisible();
});

test("sandbox prevents code from accessing the parent document or storage", async ({ page }) => {
  await page.goto("/#code-lab");
  await ready(page);
  await execute(
    page,
    `let denied = 0;
    try { window.parent.document.body.textContent; } catch { denied++; }
    try { window.parent.localStorage.clear(); } catch { denied++; }
    document.querySelector("#form")!.textContent = "Blocked: " + denied;`,
  );
  await ready(page);
  await expect(preview(page).getByText("Blocked: 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Code and preview" })).toBeVisible();
});

test("unfinished asynchronous execution times out and can be reset", async ({ page }) => {
  await page.goto("/#code-lab");
  await ready(page);
  await execute(page, "await new Promise(() => {});");
  await expect(page.getByRole("alert")).toContainText("Execution did not finish", {
    timeout: 20_000,
  });
  await expect(page.locator('iframe[title="MLForm code preview"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Reset example" }).click();
  await ready(page);
});

test("typing updates the render automatically and syntax errors preserve the last valid preview", async ({
  page,
}) => {
  await page.goto("/#code-lab");
  await ready(page);
  await edit(page, STARTER_CODE.replace("Hours per week", "Live hours"));
  await expect(preview(page).getByRole("spinbutton", { name: "Live hours" })).toHaveValue("5");
  await ready(page);
  await expect(editor(page)).toBeFocused();
  await edit(page, "const value: = ;");
  await expect(page.getByRole("alert")).toContainText("Unexpected token");
  await expect(preview(page).getByRole("spinbutton", { name: "Live hours" })).toHaveValue("5");
  await edit(page, STARTER_CODE.replace("Hours per week", "Recovered hours"));
  await expect(preview(page).getByRole("spinbutton", { name: "Recovered hours" })).toBeVisible();
  await ready(page);
  await expect(page.getByRole("alert")).toBeHidden();
});

test("the split fills the available viewport without panel frames or internal headings", async ({
  page,
}) => {
  await page.goto("/#code-lab");
  await ready(page);
  await expect(page.locator(".code-workspace").getByRole("heading")).toHaveCount(0);
  const workspace = (await page.locator(".code-workspace").boundingBox())!;
  const header = (await page.locator(".app-brand-header").boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(workspace.x).toBe(0);
  expect(workspace.width).toBe(viewport.width);
  expect(workspace.y).toBeCloseTo(header.y + header.height, 0);
  expect(workspace.y + workspace.height).toBeCloseTo(viewport.height, 0);
  for (const panel of await page.locator(".code-pane").all()) {
    expect(
      await panel.evaluate((el) => [
        getComputedStyle(el).borderRadius,
        getComputedStyle(el).borderWidth,
      ]),
    ).toEqual(["0px", "0px"]);
  }
});
