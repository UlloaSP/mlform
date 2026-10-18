import { expect, test } from "@playwright/test";

test("Series preserves decimal drafts, selection and row validation", async ({ page }) => {
  await page.goto("/#field-combinations");
  const series = page.locator('[data-role="field-combos-form"] mlf-series-field').first();
  const input = series.getByRole("spinbutton").first();
  for (const text of ["0.00000001", "-0.005", "1e-8", "1.2500", "1000000000000000000000", "1,5"]) {
    await input.fill("");
    await input.pressSequentially(text);
    await expect(input).toHaveValue(text);
    await input.press("Tab");
    await expect(input).toHaveValue(text);
  }
  await input.fill("1.2500");
  await input.press("ArrowLeft");
  await input.press("2");
  await expect(input).toHaveValue("1.25020");
  await input.fill("10");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("10.00000001");
  await input.press("ArrowDown");
  await expect(input).toHaveValue("10");
  await series.getByRole("button", { name: "Add observation", exact: true }).click();
  await expect(series.getByRole("spinbutton").nth(3)).toBeFocused();
  await series.getByRole("spinbutton").nth(3).press("Tab");
  await expect(input).toHaveAttribute("aria-invalid", "false");
  await expect(series.getByRole("spinbutton").nth(3)).toHaveAttribute("aria-invalid", "true");
});

for (const route of [
  "playground-stacked",
  "playground-split",
  "wizard-reports",
  "tabs-classic",
  "field-combinations",
]) {
  test(`range DOM, text and runtime agree in ${route}`, async ({ page }) => {
    await page.goto(`/#${route}`);
    const range = page.getByRole("slider").first();
    const value = route === "field-combinations" ? "0.5" : "0.75";
    await expect(range).toHaveValue(value);
    await expect(range).toHaveAttribute("aria-valuenow", value);
    await range.focus();
    await range.press("Tab");
    await expect(range).toHaveValue(value);
    await range.focus();
    await range.press("ArrowLeft");
    await expect(range).toHaveValue(route === "field-combinations" ? "0.4" : "0.7");
  });
}

test("numeric fields reject non-finite values without changing the input", async ({ page }) => {
  await page.goto("/#dosetailor");
  const input = page.getByLabel("Creatinine (mg/dL)", { exact: true });
  for (const text of ["1e309", "0x10", "9007199254740993", "1e-999"]) {
    await input.fill(text);
    await input.press("Tab");
    await expect(input).toHaveValue(text);
    await expect(input).toHaveAttribute("aria-invalid", "true");
  }
  await input.fill("0.00000001");
  await input.press("Tab");
  await expect(input).toHaveValue("0.00000001");
});

test("standalone numeric fields preserve decimals and expose keyboard stepping", async ({
  page,
}) => {
  await page.goto("/#tabs-classic");
  const input = page.getByRole("spinbutton", { name: "Training epochs", exact: true });
  await input.fill("20");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("21");
  await input.press("ArrowDown");
  await expect(input).toHaveValue("20");
  await input.fill("1.2500");
  await input.press("Tab");
  await expect(input).toHaveValue("1.2500");
});

test("clearing or entering an invalid material percentage retains its row and focus", async ({
  page,
}) => {
  await page.goto("/#formulation-kit");
  const row = page.locator(".fd-material-row").first();
  const number = row.locator('[data-role="material-number"]');
  const name = await number.getAttribute("aria-label");
  await number.fill("");
  await expect(number).toBeFocused();
  await expect(number).toHaveValue("");
  await number.pressSequentially("999");
  await number.press("Tab");
  await expect(number).toHaveAttribute("aria-label", name!);
  await expect(number).toHaveValue("999");
  await expect(number).toHaveAttribute("aria-invalid", "true");
  await expect(row.locator('[data-role="material-error"]')).toContainText("100");
  await number.fill("40");
  await expect(number).toHaveAttribute("aria-invalid", "false");
  await expect(row.locator('[data-role="material-range"]')).toHaveValue("40");
});
