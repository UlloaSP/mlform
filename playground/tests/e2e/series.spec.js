import { expect, test } from "@playwright/test";

test("shows one Series menu entry, four column counts and working description help", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#series");
  const form = page.locator('[data-role="series-form"]');
  const frames = form.locator("mlf-field-frame");
  await expect(frames).toHaveCount(4);
  await expect(form.locator(".aggregation-summary")).toHaveCount(0);
  const schema = JSON.parse(await page.locator('[data-role="series-schema"]').textContent());
  expect(schema.fields.map((field) => field.columns.length)).toEqual([1, 2, 3, 4]);
  for (const [index, field] of schema.fields.entries()) {
    const frame = frames.nth(index);
    const help = frame.locator(".help-btn");
    const description = frame.locator(".description");
    await expect(help).toBeVisible();
    await expect(description).not.toHaveClass(/show/);
    await help.focus();
    await page.keyboard.press("Enter");
    await expect(help).toHaveAttribute("aria-expanded", "true");
    await expect(description).toHaveText(field.description);
    await page.keyboard.press("Enter");
    await expect(description).not.toHaveClass(/show/);
  }
  await page.getByRole("button", { name: "Opciones del playground" }).click();
  await expect(page.getByRole("menuitemradio", { name: "Series", exact: true })).toHaveCount(1);
  await expect(
    page.getByRole("menuitemradio", { name: "Series and aggregates", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("menuitemradio", { name: "Biochemistry + BP", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.emulateMedia({ forcedColors: "active" });
  await expect(frames.nth(3).locator(".help-btn")).toBeVisible();
  await page.emulateMedia({ forcedColors: "none" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("series.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const positions = await page.locator(".series-demo-split").evaluate((element) => {
    const [editor, inspector] = [...element.children].map((child) => child.getBoundingClientRect());
    return {
      editorRight: editor.right,
      editorBottom: editor.bottom,
      inspectorLeft: inspector.left,
      inspectorTop: inspector.top,
      columns: getComputedStyle(element).gridTemplateColumns,
    };
  });
  if (testInfo.project.name === "chromium") {
    expect(positions.inspectorLeft).toBeGreaterThan(positions.editorRight);
    expect(
      await form.locator("mlf-series-field").evaluateAll((elements) =>
        elements.every((element) => {
          const grid = element.shadowRoot.querySelector(".grid");
          return grid.scrollWidth <= grid.clientWidth;
        }),
      ),
    ).toBe(true);
  } else {
    expect(positions.inspectorTop).toBeGreaterThan(positions.editorBottom);
  }
  expect(errors).toEqual([]);
});

test("edits observations and sends distinct aggregates from all four series", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#series");
  const form = page.locator('[data-role="series-form"]');
  const payload = page.locator('[data-role="series-payload"]');
  const submit = form.getByRole("button", { name: "Submit examples", exact: true });
  await submit.click();
  await expect(payload).toContainText('"lab_mean": 12');
  let values = JSON.parse(await payload.textContent());
  expect(Object.keys(values)).toHaveLength(35);
  expect(values).toMatchObject({
    lab_mean: 12,
    lab_sd: 2,
    pas_mean: 135,
    pas_mode: 120,
    weight_first: 60,
    weight_last: 66,
    glucose_mean: 105,
    heart_rate_mean: 75,
  });
  expect(values.pas_sd).toBeCloseTo(Math.sqrt(1100 / 3), 12);

  const first = form.locator("mlf-series-field").nth(0);
  await first.getByRole("button", { name: "Add observation", exact: true }).focus();
  await page.keyboard.press("Enter");
  const fourth = first.getByRole("spinbutton").nth(3);
  await expect(fourth).toBeFocused();
  const previous = await payload.textContent();
  await submit.click();
  await expect(fourth).toHaveAttribute("aria-invalid", "true");
  await expect(payload).toHaveText(previous);
  await fourth.fill("16");
  await submit.click();
  await expect(payload).toContainText('"lab_mean": 13');
  values = JSON.parse(await payload.textContent());
  expect(values.lab_sd).toBeCloseTo(Math.sqrt(20 / 3), 12);
  await first.getByRole("button", { name: "Remove observation 4", exact: true }).click();
  await expect(
    first.getByRole("button", { name: "Remove observation 3", exact: true }),
  ).toBeFocused();

  await form.locator("mlf-series-field").nth(1).getByRole("spinbutton").nth(0).fill("180");
  await form.locator("mlf-series-field").nth(2).getByRole("spinbutton").nth(3).fill("68");
  const monitoring = form.locator("mlf-series-field").nth(3);
  await monitoring.getByRole("spinbutton").nth(1).fill("100");
  await monitoring.getByRole("combobox").nth(0).selectOption("After meal");
  await submit.click();
  await expect(payload).toContainText('"heart_rate_mean": 85');
  values = JSON.parse(await payload.textContent());
  expect(values).toMatchObject({
    lab_mean: 12,
    pas_mean: 150,
    weight_last: 68,
    weight_range: 8,
    heart_rate_mean: 85,
  });
  await page.getByText("Original observations from the last submission", { exact: true }).click();
  const observations = JSON.parse(
    await page.locator('[data-role="series-observations"]').textContent(),
  );
  expect(observations.Monitoring[0]).toMatchObject({
    glucose: 90,
    heartRate: 100,
    context: "After meal",
  });
  expect(observations["Weight history"][0]).toMatchObject({ weight: 60, note: "Baseline" });
  await expect(form.locator(".aggregation-summary")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("preserves observations across design changes and cleans up the combined page", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#series");
  const lab = page.locator('[data-role="series-form"]').getByRole("spinbutton").first();
  await lab.fill("20");
  await page.getByRole("button", { name: "Opciones del playground" }).click();
  await page.getByLabel("Design system").selectOption("sage");
  await page.getByLabel("Apariencia").selectOption("dark");
  await page.keyboard.press("Escape");
  await expect(lab).toHaveValue("20");
  await page.getByText("Full clinical model · 114 inputs", { exact: true }).click();
  const clinical = page.locator('[data-role="series-clinical"]');
  await expect(clinical.getByRole("tab", { name: "Biochemistry", exact: true })).toBeVisible();
  await expect(clinical.locator("[data-mlf-theme-id]").first()).toHaveAttribute(
    "data-mlf-theme-id",
    "sage",
  );
  await expect(clinical.locator("[data-mlf-effective-scheme]").first()).toHaveAttribute(
    "data-mlf-effective-scheme",
    "dark",
  );
  await expect(clinical.locator("mlf-field-frame").first().locator(".help-btn")).toBeVisible();
  await page.getByRole("button", { name: "Opciones del playground" }).click();
  await page.getByRole("menuitemradio", { name: "M3DISEEN", exact: true }).click();
  await expect(page.locator(".series-demo")).toHaveCount(0);
  await page.getByRole("button", { name: "Opciones del playground" }).click();
  await page.getByRole("menuitemradio", { name: "Series", exact: true }).click();
  await expect(page.locator('[data-role="series-form"] mlf-series-field')).toHaveCount(4);
  await expect(lab).toHaveValue("10");
  await expect(clinical.locator("mlf-form")).toHaveCount(0);
  expect(errors).toEqual([]);
});
