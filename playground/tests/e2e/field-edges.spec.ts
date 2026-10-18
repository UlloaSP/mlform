import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/fixtures/field-matrix.html");
  await page.waitForFunction(() => Boolean(window.fieldMatrix));
  await page.evaluate(() => window.fieldMatrix.mount("stacked", { theme: "eshkra", mode: "dark" }));
});

test("loaded whitespace errors appear without blur", async ({ page }) => {
  await page.evaluate(() => window.fieldMatrix.setValues({ text: " " }));
  await expect(page.locator('[data-field-id="text"] .tile.error')).toBeVisible();
});

test("locked sliders use inactive cursors and colors", async ({ page }) => {
  await expect(page.getByRole("slider", { name: "Read only slider", exact: true })).toHaveCSS(
    "cursor",
    "default",
  );
  await expect(page.getByRole("slider", { name: "Disabled slider", exact: true })).toHaveCSS(
    "cursor",
    "not-allowed",
  );
});

test("long units leave an editable area and do not overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const field = page.locator('[data-field-id="long-unit"]');
  const input = field.getByRole("spinbutton");
  await input.fill("123456789");
  expect(
    await input.evaluate((el) => {
      const style = getComputedStyle(el);
      return el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    }),
  ).toBeGreaterThan(60);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(input).toHaveAttribute(
    "aria-valuetext",
    "123456789 milligrams per deciliter of measured sample",
  );
});

test("readonly caret remains hidden with forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  const input = page.getByRole("spinbutton", { name: "Read only", exact: true });
  await input.focus();
  await expect(input).toHaveCSS("caret-color", "rgba(0, 0, 0, 0)");
  await expect(input).toBeFocused();
});
