import { expect, test } from "@playwright/test";

test("loaded observations show their validation result without blur", async ({
  page,
}, testInfo) => {
  await page.goto("/#lab2pressure-lite");
  await page.getByLabel("Select an example", { exact: true }).selectOption("example-1");
  await page.getByRole("button", { name: "Load measurements" }).click();
  await expect(page.locator("mlf-field-frame .feedback.success")).toHaveCount(5);
  await expect(page.locator("mlf-field-frame .tile.success")).toHaveCount(5);
  await expect(page.locator(".app-brand-header")).not.toContainText("playground");
  await page.screenshot({ path: testInfo.outputPath("loaded-feedback.png"), fullPage: true });
});

test("Field combos shows every invalid initial value, including unknown categories", async ({
  page,
}) => {
  await page.goto("/#field-combinations");
  const frame = page.locator('mlf-field-frame[data-field-id="category-invalid-default"]');
  await expect(frame.locator(".tile.error")).toBeVisible();
  await expect(frame.locator(".feedback.error")).toContainText("available options");
  await expect(frame.locator("select")).toHaveValue("legacy");
  await frame.locator("select").selectOption("canary");
  await expect(frame.locator(".tile.success")).toBeVisible();
});

test("read-only numbers look inactive and do not show an editing caret", async ({ page }) => {
  await page.goto("/#formulation-kit");
  const input = page.locator('mlf-field-frame[data-field-id="extrusionspeed"] input');
  await expect(input).toHaveAttribute("readonly", "");
  await input.click();
  await expect(input).toHaveCSS("caret-color", "rgba(0, 0, 0, 0)");
  await expect(input).toHaveCSS("cursor", "default");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("15");
  const style = await input.evaluate((el) => ({
    background: getComputedStyle(el).backgroundColor,
    text: getComputedStyle(el).color,
  }));
  const editable = page.locator('[data-role="material-number"]').first();
  expect(style).not.toEqual(
    await editable.evaluate((el) => ({
      background: getComputedStyle(el).backgroundColor,
      text: getComputedStyle(el).color,
    })),
  );
});
