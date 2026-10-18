import type { KitHost } from "./browser-types.ts";
import { expect, test } from "@playwright/test";

const layouts = ["playground-split", "wizard-reports", "tabs-classic"];
const widths = [390, 820, 1440, 1920];

test("fixed layouts use the viewport without leaving a blank page below", async ({ page }) => {
  for (const width of [320, 390, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of layouts) {
      await page.goto(`/#${route}`);
      await expect(page.locator("mlf-field-frame").first()).toBeVisible();
      const height = await page.evaluate(() => ({
        document: document.documentElement.scrollHeight,
        viewport: innerHeight,
      }));
      expect(height.document, `${route}/${width}px`).toBeLessThanOrEqual(height.viewport + 1);
    }
  }
});

for (const width of widths) {
  for (const layout of layouts) {
    test(`${layout} fits at ${width}px with fields and ready reports`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/#${layout}`);
      await expect(page.locator("mlf-field-frame").first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (layout === "playground-split" && width >= 1440) {
        const inputShare = await page.locator("mlf-form").evaluate((host: KitHost) => {
          const shell = host.shadowRoot!.querySelector(".split-shell")!;
          const inputs = host.shadowRoot!.querySelector(".left-section")!;
          return inputs.getBoundingClientRect().width / shell.getBoundingClientRect().width;
        });
        expect(inputShare).toBeGreaterThan(0.35);
        expect(inputShare).toBeLessThan(0.5);
      }

      if (layout === "tabs-classic") {
        await page.getByRole("tab", { name: "Signals" }).click();
      } else if (layout === "wizard-reports") {
        await page.getByRole("button", { name: "Continue" }).click();
      }
      if (layout !== "playground-split") {
        expect(await page.locator("mlf-series-field").count()).toBe(4);
        expect(
          await page.locator("mlf-series-field").evaluateAll((items) =>
            items.every((el) => {
              const series = el.shadowRoot!.querySelector(".series")!;
              const control = el.shadowRoot!.querySelector(".row .control")!;
              const remove = el.shadowRoot!.querySelector(".remove-btn")!;
              const add = el.shadowRoot!.querySelector(".add-btn")!;
              return (
                series.scrollWidth <= series.clientWidth &&
                Math.abs(
                  control.getBoundingClientRect().height - remove.getBoundingClientRect().height,
                ) < 1 &&
                Math.abs(
                  control.getBoundingClientRect().height - add.getBoundingClientRect().height,
                ) < 1 &&
                getComputedStyle(control).borderRadius === getComputedStyle(remove).borderRadius &&
                remove.querySelector("svg")! !== null
              );
            }),
          ),
        ).toBe(true);
      }

      if (layout === "wizard-reports") {
        await page.getByRole("button", { name: "Continue" }).click();
      }

      await page.getByText("Run Multi-backend Inference").first().click();
      await expect
        .poll(() =>
          page.evaluate(() =>
            [...document.querySelectorAll<HTMLElement & Partial<KitHost>>("*")].some(
              (host) => (host.form ?? host.view?.form)?.state?.submissionStatus === "succeeded",
            ),
          ),
        )
        .toBe(true);
      if (layout === "tabs-classic") await page.getByRole("tab", { name: "Reports" }).click();
      if (layout === "wizard-reports") await page.getByRole("button", { name: "Latency" }).click();
      await expect(page.locator("mlf-classifier-report").first()).toBeAttached();
      await expect(page.locator("mlf-regressor-report").first()).toBeAttached();
      await expect(page.locator("mlf-backend-compare-report")).toBeAttached();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });
  }
}

test("expanding help keeps the adjacent field at its own height and preserves a quiet frame", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#tabs-classic");
  const frames = page.locator("mlf-field-frame");
  const neighbor = frames.nth(1);
  const initialHeight = await neighbor.evaluate((el) => el.getBoundingClientRect().height);
  await frames.first().locator(".help-btn").click();
  await expect(frames.first().locator(".description")).toBeVisible();
  expect(await neighbor.evaluate((el) => el.getBoundingClientRect().height)).toBe(initialHeight);
  expect(
    await frames
      .first()
      .locator(".tile")
      .evaluate((el) => {
        const style = getComputedStyle(el);
        return (
          style.borderInlineStartWidth === "1px" &&
          style.borderInlineEndWidth === "1px" &&
          style.borderInlineStartColor === style.borderInlineEndColor
        );
      }),
  ).toBe(true);
});

test("invalid fields show a danger outline after submission", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#field-combinations");
  const singlePane = await page.locator("mlf-kit-disclosure").evaluate((host: KitHost) => {
    const bounds = host.getBoundingClientRect();
    return { center: bounds.left + bounds.width / 2, width: bounds.width };
  });
  expect(Math.abs(singlePane.center - 720)).toBeLessThan(2);
  expect(singlePane.width).toBeGreaterThan(1000);
  await page.getByRole("button", { name: "Validate fields", exact: true }).click();
  const invalid = page.locator("mlf-field-frame .tile.error");
  await expect(invalid.first()).toBeVisible();
  expect(
    await invalid.first().evaluate((el) => {
      const style = getComputedStyle(el);
      return (
        style.borderInlineStartWidth === "1px" &&
        style.borderInlineStartColor === style.borderInlineEndColor &&
        style.borderInlineStartColor !== "rgba(0, 0, 0, 0)"
      );
    }),
  ).toBe(true);
});

test("read-only fields without a description do not show an empty help button", async ({
  page,
}) => {
  await page.goto("/#formulation-kit");
  const field = page.locator('mlf-field-frame[data-field-id="extrusionspeed"]');
  await expect(field.locator("input[readonly]")).toBeAttached();
  await expect(field.locator(".help-btn")).toBeHidden();
});

for (const width of [390, 820, 1440]) {
  test(`stacked fields and reports have balanced side margins at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#playground-stacked");
    await page.getByRole("button", { name: /Backend reports/ }).click();
    const insets = await page.locator("mlf-kit-disclosure").evaluate((host: KitHost) => {
      const root = host.shadowRoot!;
      const body = root.querySelector(".body")!.getBoundingClientRect();
      const fields = [...root.querySelectorAll("mlf-field-frame")].filter(
        (el) => el.getBoundingClientRect().width > 0,
      );
      const report = root.querySelector("mlf-report-frame")!.getBoundingClientRect();
      const field = fields[0].getBoundingClientRect();
      return {
        fieldLeft: field.left - body.left,
        reportLeft: report.left - body.left,
        reportRight: body.right - report.right,
      };
    });
    expect(insets.fieldLeft).toBeGreaterThan(10);
    expect(Math.abs(insets.fieldLeft - insets.reportLeft)).toBeLessThan(1);
    expect(Math.abs(insets.reportLeft - insets.reportRight)).toBeLessThan(1);
  });
}

test("series uses the same select affordance and control shape as standalone fields", async ({
  page,
}) => {
  await page.goto("/#tabs-classic");
  await page.getByRole("tab", { name: "Signals" }).click();
  await expect(page.locator("mlf-series-field .select-wrap .chevron").first()).toBeAttached();
  const number = page
    .locator('mlf-series-field .value-wrap input[role="spinbutton"][inputmode="decimal"]')
    .first();
  await expect(number).toBeAttached();
  expect(await number.evaluate((input) => getComputedStyle(input).appearance)).toBe("textfield");
  await number.fill("23.5");
  await expect
    .poll(() =>
      page
        .locator("mlf-kit-tabs")
        .evaluate(
          (host: KitHost) =>
            (host.view.form.getField("daily-signal")!.state.value as { field2: number }[])[0]
              .field2,
        ),
    )
    .toBe(23.5);
});

test("report help does not stretch the adjacent report", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#tabs-classic");
  await page.getByText("Run Multi-backend Inference").first().click();
  await expect
    .poll(() =>
      page
        .locator("mlf-kit-tabs")
        .evaluate((host: KitHost) => host.view.form.state.submissionStatus),
    )
    .toBe("succeeded");
  await page.getByRole("tab", { name: "Reports" }).click();
  const reports = page.locator("mlf-report-frame");
  const before = await reports.nth(1).evaluate((el) => el.getBoundingClientRect().height);
  await reports.first().locator(".help-btn").click();
  await expect(reports.first().locator(".description")).toBeVisible();
  expect(await reports.nth(1).evaluate((el) => el.getBoundingClientRect().height)).toBe(before);
});
