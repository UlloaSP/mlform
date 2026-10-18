import { expect, test } from "@playwright/test";

test("the menu separates examples, layouts, debugging and code", async ({ page }) => {
  await page.goto("/#field-combinations");
  await page.getByRole("button", { name: "Playground options" }).click();
  const menu = page.getByRole("menu", { name: "Demo selector" });
  for (const [name, items] of [
    ["Examples", ["M3DISEEN", "Lab2pressure/lite", "DoseTailor"]],
    ["Layouts", ["Stacked", "Split", "Wizard", "Tabs"]],
    ["Debug", ["Field combos"]],
    ["Code", ["Editor"]],
  ] as const) {
    await expect(
      menu.getByRole("group", { name, exact: true }).getByRole("menuitemradio"),
    ).toHaveText([...items]);
  }
  await expect(menu.getByRole("menuitemradio")).toHaveCount(9);
});

test("Field combos scrolls the document from the margin and from fields", async ({ page }) => {
  await page.goto("/#field-combinations");
  const input = page.getByRole("textbox", { name: "Text required bounded", exact: true });
  await expect(input).toBeVisible();
  await page.mouse.move(2, 350);
  await page.mouse.wheel(0, 650);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await input.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await input.hover();
  await page.mouse.wheel(0, 650);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 100);
  await expect(page.locator(".app-shell")).not.toHaveClass(/is-fixed-layout/);
  const header = (await page.locator(".app-brand-header").boundingBox())!;
  expect(header.y).toBe(0);
});
