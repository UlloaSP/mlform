import { expect, test } from "@playwright/test";

test("M3DISEEN shows four real model outputs and an unavailable fifth, then reports a full outage", async ({
  page,
}, testInfo) => {
  let outage = false;
  const calls = [];
  const predictions = {
    filament_mechanical_characteristics: "Good",
    extrusion_temp: 110,
    printability: "yes",
    dissolution: [62, 210, 290],
  };
  await page.route("**/api/m3diseen/a2022/*", (route) => {
    const endpoint = route.request().url().split("/").at(-1);
    calls.push(route.request().postDataJSON());
    return outage || endpoint === "printing_temp"
      ? route.fulfill({ status: 500, body: "unavailable" })
      : route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ prediction: predictions[endpoint] }),
        });
  });
  await page.goto("/#formulation-kit");
  await page.locator('[data-role="submit-button"]').click();
  const report = page.locator("mlf-formulation-prediction-report");
  await expect(report.getByText("110 °C", { exact: true })).toBeVisible();
  await expect(report.getByText("Unavailable", { exact: true })).toBeVisible();
  await expect(report.getByText(/Printing temperature:.*HTTP 500/)).toBeVisible();
  await expect(report.getByText("Dissolution over time", { exact: true })).toBeVisible();
  await report.getByText("Dissolution times", { exact: true }).click();
  await expect(report.getByRole("table", { name: "Dissolution times" })).toContainText("62.00");
  await expect(
    report.getByRole("table", { name: "Dissolution times" }).getByRole("row"),
  ).toHaveCount(5);
  await expect(
    report.getByRole("table", { name: "Dissolution times" }).getByRole("row").nth(3),
  ).toHaveText("50210.00");
  expect(calls).toHaveLength(5);
  expect(calls[0].data.formulation["Pregabalin@GL_PharrmTech"]).toBe(50);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("m3diseen.png"), fullPage: true });
  outage = true;
  await page.locator('[data-role="submit-button"]').click();
  await expect(page.locator('[data-role="form-errors"]')).toContainText(
    "could not return a prediction",
  );
  await expect(report).toBeHidden();
  await expect(page.locator('[data-role="submit-button"]')).toBeEnabled();
});

test("M3DISEEN cancels edited requests, hides stale reports and permits a clean retry", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let calls = 0;
  let release;
  const firstBatch = new Promise((resolve) => {
    release = resolve;
  });
  const predictions = {
    filament_mechanical_characteristics: "Good",
    extrusion_temp: 110,
    printability: "yes",
    dissolution: [62, 210, 290],
    printing_temp: 180,
  };
  await page.route("**/api/m3diseen/a2022/*", async (route) => {
    calls += 1;
    const endpoint = route.request().url().split("/").at(-1);
    if (calls <= 5) await firstBatch;
    await route
      .fulfill({
        contentType: "application/json",
        body: JSON.stringify({ prediction: predictions[endpoint] }),
      })
      .catch(() => {});
  });
  await page.goto("/#formulation-kit");
  const submit = page.locator('[data-role="submit-button"]');
  const inlineSubmit = page.locator('[data-role="submit-inline"]');
  const pregabalin = page.getByRole("spinbutton", { name: /Pregabalin.*percentage/ });
  await submit.click();
  await expect.poll(() => calls).toBe(5);
  await expect(submit).toBeDisabled();
  await expect(inlineSubmit).toBeDisabled();
  await expect(page.locator('[data-role="load-example"]')).toBeDisabled();
  await pregabalin.fill("49");
  await expect(submit).toBeEnabled();
  await expect(page.locator('[data-role="form-status"]')).toContainText("Parameters changed");
  await expect(page.locator("mlf-formulation-prediction-report")).toBeHidden();
  release();
  await pregabalin.fill("50");
  await inlineSubmit.click();
  await expect(
    page.locator("mlf-formulation-prediction-report").getByText("180 °C", { exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-role="form-errors"]')).toBeHidden();
  expect(calls).toBe(10);
  await pregabalin.fill("49");
  await expect(page.locator("mlf-formulation-prediction-report")).toBeHidden();
  expect(errors).toEqual([]);
});
