import { expect, test } from "@playwright/test";

test("viewport changes retain a selected material with an empty percentage", async ({ page }) => {
  await page.goto("/#formulation-kit");
  const input = page.locator('[data-role="material-number"]').first();
  const label = await input.getAttribute("aria-label");
  await input.fill("");
  await page.getByRole("button", { name: "Playground options" }).click();
  await page.getByLabel("Viewport size").selectOption("phone");
  const preview = page.frameLocator('iframe[title="Playground preview"]');
  await expect(preview.getByLabel(label!, { exact: true })).toHaveValue("");
  await page.getByLabel("Viewport size").selectOption("actual");
  await expect(page.getByLabel(label!, { exact: true })).toHaveValue("");
});

test("viewport changes preserve numeric spelling and series values", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#field-combinations");
  const input = page
    .locator('[data-role="field-combos-form"] mlf-series-field')
    .first()
    .getByRole("spinbutton")
    .first();
  await input.fill("1.2500");
  await page.getByRole("button", { name: "Playground options" }).click();
  await page.getByLabel("Viewport size").selectOption("phone");
  const preview = page.frameLocator('iframe[title="Playground preview"]');
  const previewInput = preview
    .locator('[data-role="field-combos-form"] mlf-series-field')
    .first()
    .getByRole("spinbutton")
    .first();
  await expect(previewInput).toHaveValue("1.2500");
  await previewInput.fill("0.00000001");
  await page.getByLabel("Viewport size").selectOption("actual");
  await expect(input).toHaveValue("0.00000001");
  expect(errors).toEqual([]);
});

test("external submit focuses the first invalid field and failure reports show an error", async ({
  page,
}) => {
  await page.route("**/api/dosetailor/**", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/#dosetailor");
  await page.getByRole("button", { name: "Predict", exact: true }).click();
  await expect(page.getByLabel("Age *", { exact: true })).toBeFocused();
  await page.locator("#dt-example").selectOption("example-1");
  await page.getByRole("button", { name: "Load Example", exact: true }).click();
  await page.getByRole("button", { name: "Predict", exact: true }).click();
  await expect(page.locator("mlf-report-frame .state-view.error")).toBeVisible();
  await expect(page.locator("mlf-report-frame .state-message")).toContainText("503");
  await expect(page.getByRole("button", { name: "Predict", exact: true })).toBeEnabled();
});

test("hidden conditional fields do not occupy grid cells and visible labels focus controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#dosetailor");
  await page.locator("#dt-example").selectOption("example-1");
  await page.getByRole("button", { name: "Load Example", exact: true }).click();
  const hidden = page
    .locator("mlf-field-frame")
    .filter({ has: page.locator('[aria-label="Dose (mg) *"]') });
  // The renderer is removed, and the frame itself must leave the grid.
  await expect(page.locator("mlf-field-frame[data-state-hidden]")).toHaveCount(1);
  expect(
    await page
      .locator("mlf-field-frame[data-state-hidden]")
      .evaluate((el) => el.getBoundingClientRect().width),
  ).toBe(0);
  await expect(hidden).toHaveCount(0);
  const frame = page
    .locator("mlf-field-frame")
    .filter({ has: page.getByLabel("Age *", { exact: true }) });
  await frame.locator(".label").click();
  await expect(page.getByLabel("Age *", { exact: true })).toBeFocused();
});

test("eshkra is the initial theme and mobile retains resource links", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#playground-stacked");
  await expect(page.locator("[data-mlf-theme-id]").first()).toHaveAttribute(
    "data-mlf-theme-id",
    "eshkra",
  );
  expect(
    await page
      .locator("mlf-field-frame input")
      .first()
      .evaluate((input) => getComputedStyle(input).fontFamily),
  ).toContain("Mona Sans");
  await page.getByRole("button", { name: "Playground options" }).click();
  await expect(page.getByLabel("Appearance")).toHaveValue("auto");
  await expect(
    page.getByRole("link", { name: "Docs", exact: true }).filter({ visible: true }),
  ).toHaveAttribute("href", "https://docs.mlform.eshkra.dev/");
  await expect(
    page.getByRole("link", { name: "GitHub", exact: true }).filter({ visible: true }),
  ).toBeVisible();
});
