import { expect, test } from "@playwright/test";
import { THEMES, RECIPES } from "../../src/demo-settings.ts";
import { STARTER_CODE } from "../../src/code-workspace/example.ts";
import { preview, menu, ready, edit, execute } from "./code-workspace-helpers.ts";

test("editor and preview follow every theme, mode and recipe without remounting", async ({
  page,
}) => {
  await page.goto("/#code-lab");
  await ready(page);
  await preview(page).getByRole("spinbutton", { name: "Hours per week" }).fill("11");
  await menu(page).click();
  for (const { id } of THEMES) {
    await page.getByLabel("Design system").selectOption(id);
    for (const mode of ["light", "dark"]) {
      await page.getByLabel("Appearance").selectOption(mode);
      await expect(preview(page).locator("html")).toHaveAttribute("data-mlf-theme-id", id);
      await expect(preview(page).locator("html")).toHaveAttribute(
        "data-mlf-effective-scheme",
        mode,
      );
      const background = await page
        .locator(".cm-editor")
        .evaluate((element) => getComputedStyle(element).getPropertyValue("--mlf-color-accent"));
      expect(
        await preview(page)
          .locator("body")
          .evaluate((element) => getComputedStyle(element).getPropertyValue("--mlf-color-accent")),
      ).toBe(background);
    }
  }
  for (const { id } of RECIPES) {
    await page.getByLabel("Style").selectOption(id);
    await expect(preview(page).locator("[data-mlf-recipe-id]").last()).toHaveAttribute(
      "data-mlf-recipe-id",
      id,
    );
  }
  await expect(preview(page).getByRole("spinbutton", { name: "Hours per week" })).toHaveValue("11");
  await page.keyboard.press("Escape");
  await execute(
    page,
    STARTER_CODE.replace(
      "schema: {",
      'designSystem: { theme: "sage", mode: "light" },\n  schema: {',
    ),
  );
  await ready(page);
  await menu(page).click();
  await page.getByLabel("Design system").selectOption("eshkra");
  await page.getByLabel("Appearance").selectOption("dark");
  await expect(preview(page).locator("#form > [data-mlf-theme-id]")).toHaveAttribute(
    "data-mlf-theme-id",
    "sage",
  );
  await expect(preview(page).locator("#form > [data-mlf-theme-id]")).toHaveAttribute(
    "data-mlf-effective-scheme",
    "light",
  );
});

test("unsaved edits survive demo changes and nested device previews", async ({ page }) => {
  await page.goto("/#code-lab");
  await ready(page);
  await edit(page, STARTER_CODE.replace("Hours per week", "Transferred hours"));
  await page.getByLabel("Code position").selectOption("bottom");
  await page.getByRole("separator").press("ArrowUp");
  await menu(page).click();
  await page.getByRole("menuitemradio", { name: "Tabs", exact: true }).click();
  await menu(page).click();
  await page.getByRole("menuitemradio", { name: "Editor", exact: true }).click();
  await ready(page);
  await expect(preview(page).getByRole("spinbutton", { name: "Transferred hours" })).toHaveValue(
    "5",
  );
  await menu(page).click();
  await page.getByLabel("Viewport size").selectOption("phone");
  const device = page.frameLocator('iframe[title="Playground preview"]');
  const rendered = device.frameLocator('iframe[title="MLForm code preview"]');
  await expect(device.locator(".code-status")).toHaveText("Up to date");
  await expect(device.getByLabel("Code position")).toHaveValue("bottom");
  await expect(device.getByRole("separator")).toHaveAttribute("aria-valuenow", "52");
  await expect(rendered.getByRole("spinbutton", { name: "Transferred hours" })).toHaveValue("5");
  await page.getByLabel("Design system").selectOption("dosetailor");
  await expect(rendered.locator("html")).toHaveAttribute("data-mlf-theme-id", "dosetailor");
  await page.getByLabel("Viewport size").selectOption("actual");
  await page.keyboard.press("Escape");
  await ready(page);
  await expect(page.getByLabel("Code position")).toHaveValue("bottom");
  await expect(preview(page).getByRole("spinbutton", { name: "Transferred hours" })).toHaveValue(
    "5",
  );
});

test("small mobile view starts stacked, stays in bounds and exposes errors", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/#code-lab");
  await ready(page);
  await expect(page.getByLabel("Code position")).toHaveValue("top");
  await expect(page.getByRole("button", { name: "Rerun preview", exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await execute(page, 'throw new Error("A".repeat(1000));');
  await expect(page.getByRole("alert")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Reset example" }).click();
  await ready(page);
  await page.getByLabel("Code position").selectOption("left");
  await page.getByRole("separator").press("Home");
  const reset = (await page.getByRole("button", { name: "Reset example" }).boundingBox())!;
  expect(reset.x + reset.width).toBeLessThanOrEqual(320);
  await page.getByRole("button", { name: "Reset example" }).click();
  await ready(page);
});

test("bad stored settings and unavailable storage do not block editing", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mlform-code-workspace", '{"code":8,"position":"invalid","ratio":900}');
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await page.goto("/#code-lab");
  await ready(page);
  await expect(page.getByRole("separator")).toHaveAttribute("aria-valuenow", "80");
  await execute(page, 'document.querySelector("#form")!.textContent = "Still works";');
  await ready(page);
  await expect(preview(page).getByText("Still works", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Local saving is unavailable. Copy your code before leaving."),
  ).toBeVisible();
});
