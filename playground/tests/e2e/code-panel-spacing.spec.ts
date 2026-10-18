import { expect, test } from "@playwright/test";
import { preview, ready } from "./code-workspace-helpers.ts";

test("stacked fields and report states keep space inside their panels", async ({ page }) => {
  await page.goto("/#code-lab");
  await ready(page);
  const form = preview(page).locator("mlf-form");
  const measure = () =>
    form.evaluate((host) => {
      const root = host.shadowRoot!;
      const fields = root.querySelector(".form-pane .collection")!.getBoundingClientRect();
      const body = root.querySelector(".form-pane .pane-body")!.getBoundingClientRect();
      const actions = root.querySelector(".actions")!.getBoundingClientRect();
      const report = root.querySelector(".report-pane")!.getBoundingClientRect();
      const content = root
        .querySelector(".report-pane .pane-body")!
        .lastElementChild!.getBoundingClientRect();
      return {
        before: fields.top - body.top,
        after: actions.top - fields.bottom,
        report: report.bottom - content.bottom,
      };
    });
  const gaps = await measure();
  expect(gaps.after).toBeGreaterThanOrEqual(15);
  expect(gaps.report).toBeGreaterThanOrEqual(15);
  expect(Math.abs(gaps.before - gaps.after)).toBeLessThanOrEqual(1);
  await preview(page).getByRole("button", { name: "Submit", exact: true }).click();
  await expect(preview(page).getByRole("region", { name: "Hours in four weeks" })).toContainText(
    "20.00",
  );
  expect((await measure()).report).toBeGreaterThanOrEqual(15);
});
