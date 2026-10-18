import { expect, test } from "@playwright/test";
import type { MatrixLayout } from "../fixtures/field-matrix.ts";

const themes = [
  "eshkra",
  "m3diseen",
  "dosetailor",
  "neutral",
  "cobalt",
  "graphite",
  "sage",
  "sunset",
  "airbnb",
  "clickhouse",
];
const layouts: MatrixLayout[] = ["stacked", "split", "accordion", "tabs", "wizard"];

for (const theme of themes)
  for (const layout of layouts) {
    test(`${theme}/${layout}: initial, valid, invalid, hidden and locked states`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/tests/fixtures/field-matrix.html");
      await page.waitForFunction(() => Boolean(window.fieldMatrix));
      const field = (id: string) => page.locator(`mlf-field-frame[data-field-id="${id}"]`);
      for (const mode of ["light", "dark"] as const)
        for (const recipe of ["default", "minimal", "soft", "contrast"]) {
          await page.evaluate(
            ({ layout, theme, recipe, mode }) => {
              window.fieldMatrix.mount(layout, { theme, recipe, mode });
            },
            { layout, theme, recipe, mode },
          );
          await expect(field("text").locator(".tile.success .success-mark")).toBeVisible();
          await expect(field("boolean").locator(".feedback.success")).toContainText("False");
          await expect(field("category").locator(".tile.error")).toBeVisible();
          await expect(field("category").locator("select")).toHaveValue("legacy");
          await expect(field("series-editable").locator("select")).toHaveValue("legacy");
          await expect(field("series-editable").locator("select")).toHaveAttribute(
            "aria-invalid",
            "true",
          );
          await expect(field("hidden")).toBeHidden();

          const input = field("number").locator('input[role="spinbutton"]');
          const readonly = field("readonly").locator("input");
          const disabled = field("disabled").locator("input");
          await expect(readonly).toHaveCSS("caret-color", "rgba(0, 0, 0, 0)");
          await expect(readonly).toHaveCSS("cursor", "default");
          await expect(disabled).toBeDisabled();
          const contrast = await readonly.evaluate((element) => {
            const context = document.createElement("canvas").getContext("2d")!;
            const luminance = (color: string) => {
              context.fillStyle = color;
              context.fillRect(0, 0, 1, 1);
              const channels = [...context.getImageData(0, 0, 1, 1).data]
                .slice(0, 3)
                .map((channel) => {
                  const value = channel / 255;
                  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
                });
              return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
            };
            const style = getComputedStyle(element);
            const a = luminance(style.color),
              b = luminance(style.backgroundColor);
            return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
          });
          expect(contrast, `${theme}/${recipe}/${mode} readonly text`).toBeGreaterThanOrEqual(4.5);
          const editableBackground = await input.evaluate(
            (element) => getComputedStyle(element).backgroundColor,
          );
          expect(
            await readonly.evaluate((element) => getComputedStyle(element).backgroundColor),
          ).not.toBe(editableBackground);
          await expect(field("readonly").locator(".tile.success")).toHaveCount(0);
          await expect(
            field("series-readonly").getByRole("button", { name: /Add/ }),
          ).toBeDisabled();
          await expect(field("series-disabled").locator("input").first()).toBeDisabled();
          await expect(field("series-readonly").locator('input[role="spinbutton"]')).toHaveCSS(
            "caret-color",
            "rgba(0, 0, 0, 0)",
          );

          await input.fill("-1");
          await expect(input).toBeFocused();
          await expect(field("number").locator(".tile.error")).toBeVisible();
          await input.fill("5.1");
          await expect(input).toBeFocused();
          await expect(field("number").locator(".tile.success")).toBeVisible();
          await field("category").locator("select").selectOption("two");
          await expect(field("category").locator(".tile.success")).toBeVisible();
          await field("series-editable").locator("select").selectOption("two");
          await expect(field("series-editable").locator(".tile.success")).toBeVisible();

          await page.evaluate(() =>
            window.fieldMatrix.setValues({ boolean: true, date: "2027-01-01", number: 20 }),
          );
          await expect(field("hidden")).toBeVisible();
          await expect(field("date").locator(".tile.error")).toBeVisible();
          await expect(field("number").locator(".tile.error")).toBeVisible();
          await page.evaluate(() =>
            window.fieldMatrix.setValues({ date: "2026-06-01", number: 5 }),
          );
          await expect(field("date").locator(".tile.success")).toBeVisible();
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
          expect(
            await field("number")
              .locator(".unit")
              .evaluate((unit) => unit.scrollHeight <= unit.clientHeight),
          ).toBe(true);
        }
      expect(errors).toEqual([]);
    });
  }
