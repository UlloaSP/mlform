import { expect, test } from "@playwright/test";
import { SERIES_SCHEMA } from "../../src/playground/series-schema.ts";

test("Field combos includes four series with visible and hidden live aggregates", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#field-combinations");
  const series = page.locator('[data-role="field-combos-form"] mlf-series-field');
  const frames = page.locator("mlf-field-frame").filter({ has: page.locator("mlf-series-field") });
  expect(await series.count()).toBeGreaterThan(4);
  for (const [index, field] of SERIES_SCHEMA.fields.entries()) {
    await expect(series.nth(index).locator(".aggregation-summary")).toHaveCount(
      field.showAggregationSummary ? 1 : 0,
    );
    const help = frames.nth(index).locator(".help-btn");
    await help.focus();
    await page.keyboard.press("Enter");
    await expect(help).toHaveAttribute("aria-expanded", "true");
    await expect(frames.nth(index).locator(".description")).toHaveText(field.description);
    await page.keyboard.press("Enter");
  }
  const lab = series.first();
  await expect(lab.locator(".aggregation-summary")).toContainText("lab_mean");
  await expect(lab.locator("dd").first()).toHaveText("12");
  await lab.getByRole("spinbutton").first().fill("16");
  await expect(lab.locator("dd").first()).toHaveText("14");
  await lab.getByRole("button", { name: "Add observation", exact: true }).click();
  const fourth = lab.getByRole("spinbutton").nth(3);
  await expect(fourth).toBeFocused();
  await fourth.fill("18");
  await expect(lab.locator("dd").first()).toHaveText("15");
  await lab.getByRole("button", { name: "Remove observation 4", exact: true }).click();
  await expect(
    lab.getByRole("button", { name: "Remove observation 3", exact: true }),
  ).toBeFocused();
  await expect(lab.locator("dd").first()).toHaveText("14");
  await series.nth(1).getByRole("spinbutton").first().fill("180");
  await expect(series.nth(1).locator(".aggregation-summary")).toHaveCount(0);
  await series.nth(2).getByRole("spinbutton").nth(3).fill("68");
  await expect(series.nth(2).locator("dd").nth(1)).toHaveText("68 kg");
  await series.nth(3).getByRole("combobox").first().selectOption("After meal");
  await expect(series.nth(3).locator(".aggregation-summary")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("series follow themes and unmount with Field combos", async ({ page }) => {
  await page.goto("/#field-combinations");
  const series = page.locator('[data-role="field-combos-form"] mlf-series-field');
  const lab = series.first().getByRole("spinbutton").first();
  await lab.fill("20");
  await page.getByRole("button", { name: "Playground options" }).click();
  await expect(page.getByRole("menuitemradio", { name: "Series", exact: true })).toHaveCount(0);
  await page.getByLabel("Design system").selectOption("sage");
  await page.getByLabel("Appearance").selectOption("dark");
  await page.keyboard.press("Escape");
  await expect(lab).toHaveValue("20");
  await page.getByRole("button", { name: "Playground options" }).click();
  await page.getByRole("menuitemradio", { name: "M3DISEEN", exact: true }).click();
  await expect(page.locator(".field-combos")).toHaveCount(0);
  await page.getByRole("button", { name: "Playground options" }).click();
  await page.getByRole("menuitemradio", { name: "Field combos", exact: true }).click();
  expect(await series.count()).toBeGreaterThan(4);
  await expect(lab).toHaveValue("10");
  await expect(page.getByText("Full clinical model · 114 inputs")).toHaveCount(0);
});
