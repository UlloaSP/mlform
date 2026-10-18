import { expect, test } from "@playwright/test";
import { builtinFieldKinds } from "mlform/builtins";

test("all field kinds expose errors, success and inactive states on load", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#field-combinations");
  const frame = (id: string) => page.locator(`mlf-field-frame[data-field-id="${id}"]`);
  for (const kind of Object.values(builtinFieldKinds)) {
    await expect(frame(`${kind}-success`).locator(".tile.success")).toHaveCount(1);
    await expect(frame(`${kind}-required-empty`).locator(".feedback.error")).toContainText(
      "This field is required.",
    );
    await expect(
      frame(`${kind}-disabled`).locator("input,textarea,select,button:not(.help-btn)").first(),
    ).toBeDisabled();
    await expect(frame(`${kind}-read-only`).locator(".tile.error")).toHaveCount(0);
    await expect(frame(`${kind}-conditional`)).toBeHidden();
  }
  await frame("show-conditional-cases").locator("label.opt").filter({ hasText: "True" }).click();
  for (const kind of Object.values(builtinFieldKinds))
    await expect(frame(`${kind}-conditional`)).toBeVisible();
  await expect(page.locator(".field-combos-clinical")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("invalid field cases recover independently without changing neighbouring cases", async ({
  page,
}) => {
  await page.goto("/#field-combinations");
  for (const [id, value] of [
    ["text-too-long", "OK"],
    ["number-invalid", "4.5"],
    ["number-above-maximum", "100"],
  ]) {
    const frame = page.locator(`mlf-field-frame[data-field-id="${id}"]`);
    await frame.locator("input").fill(value);
    await frame.locator("input").press("Tab");
    await expect(frame.locator(".tile.success")).toHaveCount(1);
  }
  await expect(page.locator('[data-field-id="number-underflow"] .tile.error')).toHaveCount(1);
  const select = page.locator('[data-field-id="category-invalid-default"] select');
  await select.selectOption("canary");
  await expect(
    page.locator('[data-field-id="category-invalid-default"] .tile.success'),
  ).toHaveCount(1);
});

test("selected ratings remain readable in every theme and scheme", async ({ page }) => {
  await page.goto("/#field-combinations");
  const selected = page.locator('[data-field-id="rating-success"] .rating-btn.selected');
  await expect(selected).toBeVisible();
  await page.getByRole("button", { name: "Playground options" }).click();
  for (const theme of [
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
  ]) {
    await page.getByLabel("Design system").selectOption(theme);
    for (const mode of ["light", "dark"]) {
      await page.getByLabel("Appearance").selectOption(mode);
      await expect
        .poll(
          () =>
            selected.evaluate((element) => {
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
            }),
          { message: `${theme}/${mode} selected rating contrast` },
        )
        .toBeGreaterThanOrEqual(4.5);
    }
  }
});
