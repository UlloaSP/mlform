import { expect, test } from "@playwright/test";

test("menu opens both new MLForm examples and preserves M3DISEEN", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Playground options" }).click();
  await expect(page.getByRole("menuitemradio", { name: "M3DISEEN", exact: true })).toBeVisible();
  await page.getByRole("menuitemradio", { name: "Lab2pressure/lite", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Lab2pressure/lite", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Playground options" }).click();
  await page.getByRole("menuitemradio", { name: "DoseTailor", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Load Example", exact: true })).toBeVisible();
  await expect(page.locator("mlf-field-frame")).toHaveCount(30);
  await expect(page.locator("mlf-number-field").first()).toBeVisible();
  await expect(page.locator("mlf-category-field").first()).toBeVisible();
  await expect(page.locator("mlf-kit-disclosure")).toHaveCount(1);
  await page.getByRole("button", { name: /Demographics/ }).click();
  await expect(page.getByLabel("Age *", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: /Demographics/ }).click();
  await expect(page.getByLabel("Age *", { exact: true })).toBeVisible();
  await expect(page.locator(".dt-nav, .dt-footer, .dosetailor img, .dt-intro")).toHaveCount(0);
  expect(
    await page.locator(".dosetailor").evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.backgroundColor, image: style.backgroundImage };
    }),
  ).toEqual({ color: "rgba(0, 0, 0, 0)", image: "none" });
});

test("Lab2pressure runs the real model, validates series, and invalidates edited results", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#lab2pressure-lite");
  await page.getByRole("button", { name: "Predict blood pressure", exact: true }).click();
  await expect(page.locator('[data-role="errors"]')).toBeVisible();
  await expect(page.locator("mlf-series-field")).toHaveCount(5);
  await page.locator("#bp-example").selectOption("example-1");
  await page.getByRole("button", { name: "Load measurements" }).click();
  await page.getByRole("button", { name: "Predict blood pressure", exact: true }).click();
  await expect(page.locator("mlf-classifier-report")).toBeVisible();
  await expect(page.locator('[data-role="status"]')).toContainText("Prediction calculated");
  const first = page.locator("mlf-series-field").first().getByRole("spinbutton").first();
  await first.fill("20");
  await expect(page.locator("mlf-classifier-report")).toBeHidden();
  await expect(page.locator('[data-role="status"]')).toContainText("Measurements have changed");
  await page.locator("#bp-example").selectOption("example-2");
  await page.getByRole("button", { name: "Load measurements" }).click();
  await page.getByRole("button", { name: "Predict blood pressure", exact: true }).click();
  await expect(page.locator("mlf-classifier-report")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("lab2pressure.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("DoseTailor loads original examples, changes modes, renders real API-shaped results and errors", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  const requests: { url: string; body: Record<string, unknown> }[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/dosetailor/**", async (route) => {
    requests.push({ url: route.request().url(), body: route.request().postDataJSON() });
    if (requests.length === 3) return route.fulfill({ status: 503, body: "unavailable" });
    const body = route.request().url().includes("recommend_dose")
      ? {
          optimal_dose: 5.93,
          optimal_level: 8.02,
          dose_values: [1, 3, 5.93, 8],
          predictions: [6.8, 7.5, 8.02, 9],
        }
      : { predicted_level: 7.88 };
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/#dosetailor");
  await page.getByRole("button", { name: "Predict", exact: true }).click();
  await expect(page.locator('[data-role="errors"]')).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.locator("#dt-example").selectOption("example-1");
  await page.getByRole("button", { name: "Load Example", exact: true }).click();
  await expect(page.getByLabel("Age *", { exact: true })).toHaveValue("75");
  await expect(page.getByLabel("Type", { exact: true })).toHaveValue("level");
  await expect(page.getByLabel("Dose (mg) *", { exact: true })).toBeHidden();
  await expect(page.getByLabel("Target Level (ng/ml) *", { exact: true })).toHaveValue("8");
  await expect(page.locator('[data-role="status"]')).toContainText("Labs Model");
  const hematocrit = page.getByLabel("Hematocrit (%)", { exact: true });
  await hematocrit.focus();
  await page.keyboard.press("Tab");
  await expect(hematocrit).toHaveValue("40");
  await expect(page.locator('[data-role="status"]')).toContainText("Labs Model");
  await page.getByRole("button", { name: "Predict", exact: true }).click();
  await expect(
    page.getByRole("table", { name: "DoseTailor prediction", exact: true }),
  ).toContainText("5.93 mg");
  await expect(page.getByRole("img", { name: /Dose-level curve returned/ })).toBeVisible();
  expect(requests[0].url).toContain("/recommend_dose/labs");
  expect(requests[0].body).toMatchObject({ target_level: 8, age_group: 5, pgp_inhibit: 0 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("dosetailor.png"), fullPage: true });
  await page.getByLabel("Type", { exact: true }).selectOption("dose");
  await expect(page.locator("mlf-dosetailor-prediction")).toBeHidden();
  await page.getByLabel("Dose (mg) *", { exact: true }).fill("5");
  await page.getByLabel("Creatinine (mg/dL)", { exact: true }).fill("");
  await page.getByRole("button", { name: "Predict", exact: true }).click();
  await expect(
    page.getByRole("table", { name: "DoseTailor prediction", exact: true }),
  ).toContainText("7.88 ng/ml");
  expect(requests[1].url).toContain("/inference/nolabs");
  expect(requests[1].body.target_level).toBeUndefined();
  await page.getByRole("button", { name: "Predict", exact: true }).click();
  await expect(page.locator('[data-role="errors"]')).toContainText("unavailable (503)");
  await expect(page.locator("mlf-dosetailor-prediction")).toBeHidden();
  await expect(page.getByRole("button", { name: "Predict", exact: true })).toBeEnabled();
  await page.locator("#dt-example").selectOption("example-2");
  await page.getByRole("button", { name: "Load Example", exact: true }).click();
  await expect(page.getByLabel("Age *", { exact: true })).toHaveValue("58");
  await expect(page.getByLabel("Clinical Setting", { exact: true })).toHaveValue("0");
  await expect(page.getByLabel("Type", { exact: true })).toHaveValue("level");
  expect(errors).toEqual([]);
});

test("both demos support dark mode, viewport simulation and remounting", async ({
  page,
}, testInfo) => {
  for (const demo of ["lab2pressure-lite", "dosetailor"]) {
    await page.goto(`/#${demo}`);
    await page.getByRole("button", { name: "Playground options" }).click();
    await page.locator('[data-role="mode-select"]').selectOption("dark");
    await expect(page.locator(".clinical-page")).toHaveAttribute("data-mode", "dark");
    const buttonContrast = await page.locator('[data-role="submit"]').evaluate((button) => {
      const luminance = (color: string) => {
        const channels = color
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map((value) => Number(value) / 255)
          .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      const style = getComputedStyle(button);
      const foreground = luminance(style.color);
      const background = luminance(style.backgroundColor);
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    });
    expect(buttonContrast).toBeGreaterThanOrEqual(4.5);
    await page.keyboard.press("Escape");
    await page.screenshot({ path: testInfo.outputPath(`${demo}-dark.png`), fullPage: true });
    await page.getByRole("button", { name: "Playground options" }).click();
    await page.locator('[data-role="viewport-select"]').selectOption("phone");
    await expect(page.frameLocator(".app-preview-frame").locator(".clinical-page")).toHaveAttribute(
      "data-mode",
      "dark",
    );
    await page.locator('[data-role="viewport-select"]').selectOption("actual");
    await page.locator('[data-role="mode-select"]').selectOption("light");
    await expect(page.locator(".clinical-page")).toHaveAttribute("data-mode", "light");
  }
});

test("editing pending DoseTailor parameters cancels cleanly and allows retry and demo switching", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let calls = 0;
  let release!: () => void;
  await page.route("**/api/dosetailor/**", async (route) => {
    calls += 1;
    if (calls !== 2)
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    await route
      .fulfill({ contentType: "application/json", body: JSON.stringify({ predicted_level: 7.88 }) })
      .catch(() => {});
  });
  await page.goto("/#dosetailor");
  await page.locator("#dt-example").selectOption("example-1");
  await page.getByRole("button", { name: "Load Example", exact: true }).click();
  await page.getByLabel("Type", { exact: true }).selectOption("dose");
  await page.getByLabel("Dose (mg) *", { exact: true }).fill("5");
  await page.getByRole("button", { name: "Predict", exact: true }).click();
  await expect.poll(() => calls).toBe(1);
  await expect(page.getByRole("button", { name: "Predicting…", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Load Example", exact: true })).toBeDisabled();
  await page.getByLabel("Weight (kg) *", { exact: true }).fill("90");
  await expect(page.getByRole("button", { name: "Predict", exact: true })).toBeEnabled();
  await expect(page.locator('[data-role="status"]')).toContainText("Parameters changed");
  await expect(page.locator("mlf-dosetailor-prediction")).toBeHidden();
  release();
  await page.getByRole("button", { name: "Predict", exact: true }).click();
  await expect(
    page.getByRole("table", { name: "DoseTailor prediction", exact: true }),
  ).toContainText("7.88 ng/ml");
  await expect(page.locator('[data-role="errors"]')).toBeHidden();
  await page.getByRole("button", { name: "Predict", exact: true }).click();
  await expect.poll(() => calls).toBe(3);
  await page.getByRole("button", { name: "Playground options" }).click();
  await page.getByRole("menuitemradio", { name: "Lab2pressure/lite", exact: true }).click();
  release();
  await expect(page.getByRole("heading", { name: "Lab2pressure/lite", exact: true })).toBeVisible();
  await expect(page.locator('[data-role="errors"]')).toBeHidden();
  expect(errors).toEqual([]);
});
