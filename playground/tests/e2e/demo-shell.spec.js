import { expect, test } from "@playwright/test";

test("demo menu supports keyboard navigation", async ({ page }) => {
  await page.goto("/#formulation-kit");
  const menuButton = page.getByRole("button", { name: "Opciones del playground" });
  const menu = page.getByRole("menu", { name: "Demo selector" });

  await expect(menu).toBeHidden();
  await menuButton.focus();
  await page.keyboard.press("ArrowDown");
  await expect(menu).toBeVisible();
  await expect(page.getByRole("menuitemradio", { name: "M3DISEEN" })).toBeFocused();

  await page.keyboard.press("End");
  await expect(page.getByRole("menuitemradio", { name: "Tabs" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(menuButton).toBeFocused();

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#tabs-classic$/);
  await expect(menu).toBeHidden();
  await expect(menuButton).toBeFocused();
});

test("design controls update the mounted form and persist across demos", async ({ page }) => {
  await page.goto("/#playground-stacked");
  await page.getByRole("button", { name: "Opciones del playground" }).click();

  const theme = page.getByLabel("Design system");
  const recipe = page.getByLabel("Estilo");
  const mode = page.getByLabel("Apariencia");
  await expect(theme.locator("option")).toHaveCount(7);
  await expect(recipe.locator("option")).toHaveCount(4);

  const input = page.locator("mlf-field-frame input").first();
  await input.fill("Keep this value");
  await theme.selectOption("sage");
  await recipe.selectOption("soft");
  await mode.selectOption("dark");
  await expect(input).toHaveValue("Keep this value");
  await expect(page.locator("[data-mlf-theme-id]").first()).toHaveAttribute(
    "data-mlf-theme-id",
    "sage",
  );
  await expect(page.locator("[data-mlf-recipe-id]").first()).toHaveAttribute(
    "data-mlf-recipe-id",
    "soft",
  );
  await expect(page.locator("[data-mlf-effective-scheme]").first()).toHaveAttribute(
    "data-mlf-effective-scheme",
    "dark",
  );

  await page.reload();
  await page.getByRole("button", { name: "Opciones del playground" }).click();
  await expect(theme).toHaveValue("sage");
  await expect(recipe).toHaveValue("soft");
  await expect(mode).toHaveValue("dark");
  await page.getByRole("menuitemradio", { name: "M3DISEEN" }).click();
  await expect(page.locator(".fd-shell")).toHaveAttribute("data-mlf-theme-id", "sage");
  await expect(page.locator(".fd-shell")).toHaveAttribute("data-mlf-effective-scheme", "dark");
});

test("device preview uses real viewport widths and accepts custom pixels", async ({ page }) => {
  await page.goto("/#playground-stacked");
  await page.getByRole("button", { name: "Opciones del playground" }).click();
  const size = page.getByLabel("Tamaño de pantalla");
  const frame = page.locator('iframe[title="Vista previa del playground"]');
  const preview = page.frameLocator('iframe[title="Vista previa del playground"]');

  for (const [preset, width, height] of [
    ["phone", 390, 844],
    ["tablet", 820, 1180],
    ["laptop", 1366, 768],
    ["pc", 1920, 1080],
    ["ultrawide", 2560, 1080],
  ]) {
    await size.selectOption(preset);
    await expect(preview.getByText("Release controls").first()).toBeVisible();
    await expect
      .poll(() =>
        frame.evaluate((element) => [
          element.contentWindow.innerWidth,
          element.contentWindow.innerHeight,
        ]),
      )
      .toEqual([width, height]);
    if (preset === "phone") {
      await page.keyboard.press("Escape");
      await preview.locator("mlf-field-frame input").first().fill("Keep while resizing");
      await page.getByRole("button", { name: "Opciones del playground" }).click();
    } else {
      await expect(preview.locator("mlf-field-frame input").first()).toHaveValue(
        "Keep while resizing",
      );
    }
  }

  await size.selectOption("custom");
  await page.getByLabel("Ancho (px)").fill("600");
  await page.getByLabel("Alto (px)").fill("900");
  await page.getByLabel("Alto (px)").press("Tab");
  await expect
    .poll(() =>
      frame.evaluate((element) => [
        element.contentWindow.innerWidth,
        element.contentWindow.innerHeight,
      ]),
    )
    .toEqual([600, 900]);
  expect(
    await frame.evaluate(
      (element) => element.contentWindow.matchMedia("(max-width: 700px)").matches,
    ),
  ).toBe(true);
  await expect(preview.locator("mlf-field-frame input").first()).toHaveValue("Keep while resizing");

  await page.getByLabel("Design system").selectOption("sage");
  await page.getByLabel("Apariencia").selectOption("dark");
  await expect(preview.locator("[data-mlf-theme-id]").first()).toHaveAttribute(
    "data-mlf-theme-id",
    "sage",
  );
  await expect(preview.locator("[data-mlf-effective-scheme]").first()).toHaveAttribute(
    "data-mlf-effective-scheme",
    "dark",
  );

  await page.reload();
  await page.getByRole("button", { name: "Opciones del playground" }).click();
  await expect(size).toHaveValue("custom");
  await expect(page.getByLabel("Ancho (px)")).toHaveValue("600");
  await expect(page.getByLabel("Alto (px)")).toHaveValue("900");
  await page.getByRole("menuitemradio", { name: "Tabs" }).click();
  await expect(preview.getByText("Basics").first()).toBeVisible();
  await page.getByRole("button", { name: "Opciones del playground" }).click();
  await size.selectOption("actual");
  await expect(frame).toHaveCount(0);
});
