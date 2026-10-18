import { expect, test } from "@playwright/test";

test("collects clinical observations and keeps all 114 external inputs in order", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#series");
  await page.getByText("Full clinical model · 114 inputs", { exact: true }).click();
  await expect(page.getByRole("tab", { name: "Biochemistry", exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Hematology", exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Blood pressure", exact: true })).toBeVisible();
  await expect(page.locator(".aggregation-summary")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("biochemistry.png"), fullPage: true });
  const payload = page.locator('[data-role="clinical-payload"]');
  const send = page.getByRole("button", { name: "Submit measurements", exact: true });
  await send.click();
  await expect(payload).toContainText('"113": 90');
  let modelValues = JSON.parse(await payload.textContent()).modelValues;
  expect(Object.keys(modelValues)).toEqual(
    Array.from({ length: 114 }, (_, index) => String(index)),
  );
  expect(modelValues).toMatchObject({
    0: 12,
    1: 2,
    4: 11,
    5: 13,
    102: 130,
    103: 10,
    104: 125,
    105: 135,
    106: 120,
    107: 140,
    108: 80,
    109: 10,
    110: 75,
    111: 85,
    112: 70,
    113: 90,
  });

  await page.getByRole("spinbutton", { name: "Anion GAP Value 1", exact: true }).fill("16");
  await send.click();
  await expect(payload).toContainText('"0": 14');
  modelValues = JSON.parse(await payload.textContent()).modelValues;
  expect(modelValues).toMatchObject({ 0: 14, 1: 2, 2: 12, 3: 16, 4: 13, 5: 15 });

  const anion = page
    .locator("mlf-series-field")
    .filter({ has: page.getByRole("spinbutton", { name: "Anion GAP Value 1", exact: true }) });
  await anion.getByRole("button", { name: "Add measurement", exact: true }).click();
  const fourth = page.getByRole("spinbutton", { name: "Anion GAP Value 4", exact: true });
  await expect(fourth).toBeFocused();
  const lastPayload = await payload.textContent();
  await send.click();
  await expect(payload).toHaveText(lastPayload);
  await expect(fourth).toHaveAttribute("aria-invalid", "true");
  await fourth.fill("18");
  await send.click();
  await expect(payload).toContainText('"0": 15');
  modelValues = JSON.parse(await payload.textContent()).modelValues;
  expect(modelValues["1"]).toBeCloseTo(Math.sqrt(20 / 3), 12);
  expect(modelValues).toMatchObject({ 0: 15, 2: 12, 3: 18, 4: 13.5, 5: 16.5 });
  await expect(page.locator(".aggregation-summary")).toHaveCount(0);

  await page.getByRole("tab", { name: "Hematology", exact: true }).click();
  await expect(
    page.getByRole("spinbutton", { name: "Hematocrit Value 1", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Blood pressure", exact: true }).click();
  await expect(
    page.getByRole("spinbutton", { name: "Blood pressure Systolic 1", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("blood-pressure.png"), fullPage: true });
  await page
    .getByRole("spinbutton", { name: "Blood pressure Systolic 1", exact: true })
    .fill("150");
  await send.click();
  await expect(payload).toContainText('"102": 140');
  modelValues = JSON.parse(await payload.textContent()).modelValues;
  expect(modelValues).toMatchObject({ 102: 140, 103: 10, 104: 135, 105: 145, 106: 130, 107: 150 });
  await page.getByRole("tab", { name: "Result", exact: true }).click();
  await expect(page.locator("mlf-classifier-report")).toContainText("65");

  await page.getByText("View transformed schema", { exact: true }).click();
  const schema = JSON.parse(await page.locator('[data-role="clinical-schema"]').textContent());
  expect(schema.fields).toHaveLength(18);
  expect(schema.fields.flatMap((field) => field.aggregations)).toHaveLength(114);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
