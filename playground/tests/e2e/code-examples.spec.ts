import { expect, test } from "@playwright/test";
import { CODE_EXAMPLES } from "../../src/code-workspace/examples.ts";
import { preview, ready, editor } from "./code-workspace-helpers.ts";

for (const example of CODE_EXAMPLES) {
  test(`Code example ${example.id} renders fields and submits real reports`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#code-lab");
    await ready(page);
    await page.getByLabel("Code example", { exact: true }).selectOption(example.id);
    await ready(page);
    await expect(editor(page)).toContainText("import { mountForm }");
    if (example.id === "wizard") {
      await preview(page).getByRole("button", { name: "Next", exact: true }).click();
      await preview(page).getByRole("button", { name: "Next", exact: true }).click();
    }
    await preview(page).getByRole("button", { name: "Submit", exact: true }).click();
    if (example.id === "tabs")
      await preview(page).getByRole("tab", { name: "Results", exact: true }).click();
    const result =
      example.id === "series"
        ? "Average weight"
        : example.id === "choices"
          ? "Estimated shipping"
          : "Hours in four weeks";
    await expect(preview(page).getByRole("region", { name: result, exact: true })).toContainText(
      example.id === "series" ? "70.00" : example.id === "choices" ? "3.00" : "20.00",
    );
    if (["groups", "split", "tabs", "wizard"].includes(example.id)) {
      await expect(
        preview(page).getByRole("region", { name: "Review decision", exact: true }),
      ).toContainText("Ready");
    }
    expect(
      await preview(page)
        .locator("html")
        .evaluate((el) => el.scrollWidth <= innerWidth),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("selected example survives reload; reset restores that example and undo recovers edits", async ({
  page,
}) => {
  await page.goto("/#code-lab");
  await ready(page);
  await page.getByLabel("Code example", { exact: true }).selectOption("choices");
  await ready(page);
  await page.reload();
  await ready(page);
  await expect(page.getByLabel("Code example", { exact: true })).toHaveValue("choices");
  await editor(page).focus();
  await editor(page).press("ControlOrMeta+End");
  await page.keyboard.insertText("\n// My changes");
  await ready(page);
  await page.getByRole("button", { name: "Reset example" }).click();
  await ready(page);
  await expect(editor(page)).not.toContainText("My changes");
  await expect(editor(page)).toContainText("Customs note");
  await editor(page).press("ControlOrMeta+z");
  await expect(editor(page)).toContainText("My changes");
});
