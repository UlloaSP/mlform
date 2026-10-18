import { expect, test } from "@playwright/test";

const themes = [
  "eshkra",
  "m3diseen",
  "dosetailor",
  "neutral",
  "cobalt",
  "graphite",
  "sage",
  "sunset",
  "airbnb",
  "clickhouse",
];

for (const theme of themes) {
  test(`${theme} colors the floating menu in every recipe and scheme`, async ({ page }) => {
    await page.goto("/#field-combinations");
    await page.getByRole("button", { name: "Playground options" }).click();
    await page.getByLabel("Design system").selectOption(theme);
    const shell = page.locator("html");
    for (const mode of ["light", "dark"]) {
      await page.getByLabel("Appearance").selectOption(mode);
      for (const recipe of ["default", "minimal", "soft", "contrast"]) {
        await page.getByLabel("Style").selectOption(recipe);
        await expect(shell).toHaveAttribute("data-mlf-theme-id", theme);
        await expect(shell).toHaveAttribute("data-mlf-effective-scheme", mode);
        await expect(page.locator("mlf-kit-disclosure")).toHaveAttribute(
          "data-mlf-theme-id",
          theme,
        );
        const backgrounds = await page.evaluate(() =>
          [document.documentElement, document.body, document.querySelector(".app-shell")!].map(
            (element) => getComputedStyle(element).backgroundColor,
          ),
        );
        expect(new Set(backgrounds).size).toBe(1);
        expect(backgrounds[0]).not.toBe("rgba(0, 0, 0, 0)");
        const result = await shell.evaluate(async (host) => {
          const menu = host.querySelector(".app-menu")!;
          void getComputedStyle(host.querySelector(".app-menu-button")!).backgroundColor;
          await Promise.allSettled(
            menu.getAnimations({ subtree: true }).map((animation) => animation.finished),
          );
          const css = getComputedStyle(host);
          const ctx = document.createElement("canvas").getContext("2d")!;
          const rgb = (color: string) => {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
          };
          const luminance = (color: string) => {
            const [r, g, b] = rgb(color).map((v) => {
              v /= 255;
              return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
            });
            return r * 0.2126 + g * 0.7152 + b * 0.0722;
          };
          const checks = [
            [".app-menu-panel", "surface-elevated", "text"],
            [".app-menu-button", "hover-surface", "text"],
            [".app-menu-option.is-active", "accent", "text-inverse"],
            [".app-menu-field select", "surface", "text"],
          ];
          return checks.map(([selector, background, text]) => {
            const style = getComputedStyle(host.querySelector(selector)!);
            const a = luminance(style.color),
              b = luminance(style.backgroundColor);
            return {
              selector,
              colors: [rgb(style.backgroundColor), rgb(style.color)],
              expected: [
                rgb(css.getPropertyValue(`--mlf-color-${background}`)),
                rgb(css.getPropertyValue(`--mlf-color-${text}`)),
              ],
              contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
            };
          });
        });
        for (const check of result) {
          expect(check.colors, `${mode}/${recipe} ${check.selector}`).toEqual(check.expected);
          expect(check.contrast, `${mode}/${recipe} ${check.selector}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
}

test("system mode updates shell, native selects and device preview together", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/#formulation-kit");
  await page.getByRole("button", { name: "Playground options" }).click();
  await page.getByLabel("Design system").selectOption("dosetailor");
  await page.getByLabel("Viewport size").selectOption("phone");
  const preview = page.frameLocator('iframe[title="Playground preview"]');
  for (const mode of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme: mode });
    await expect(page.locator("html")).toHaveAttribute("data-mlf-effective-scheme", mode);
    await expect(page.getByLabel("Design system")).toHaveCSS("color-scheme", mode);
    await expect(preview.locator("html")).toHaveAttribute("data-mlf-theme-id", "dosetailor");
    await expect(preview.locator("html")).toHaveAttribute("data-mlf-effective-scheme", mode);
    await expect(preview.locator(".fd-shell")).toHaveAttribute("data-mlf-effective-scheme", mode);
  }
  await page.reload();
  await page.getByRole("button", { name: "Playground options" }).click();
  await expect(page.getByLabel("Design system")).toHaveValue("dosetailor");
  await expect(page.getByLabel("Appearance")).toHaveValue("auto");
  await expect(page.locator("html")).toHaveAttribute("data-mlf-theme-id", "dosetailor");
});

test("brand theme fonts load locally and the example heading stays centered", async ({ page }) => {
  await page.goto("/#formulation-kit");
  for (const [theme, family] of [
    ["eshkra", "Mona Sans Variable"],
    ["m3diseen", "Quicksand"],
    ["dosetailor", "Quicksand"],
  ]) {
    await page.getByRole("button", { name: "Playground options" }).click();
    await page.getByLabel("Design system").selectOption(theme);
    await page.keyboard.press("Escape");
    expect(
      await page.evaluate(
        async (family) => (await document.fonts.load(`500 16px "${family}"`)).length,
        family,
      ),
    ).toBeGreaterThan(0);
    await expect(page.locator(".app-menu-panel")).toHaveCSS("font-family", new RegExp(family));
    const heading = page.locator(".fd-top-toggle > span");
    const centers = await heading.evaluate((el) => {
      const title = el.getBoundingClientRect();
      const card = el.closest(".fd-top-card")!.getBoundingClientRect();
      return [title.left + title.width / 2, card.left + card.width / 2];
    });
    expect(Math.abs(centers[0] - centers[1])).toBeLessThan(1);
    await expect(page.getByText("Select an example", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Select an example", { exact: true })).toBeVisible();
    await expect(page.locator(".fd-top-caret path")).toHaveAttribute("d", "m6 9 6 6 6-6");
    const toggle = page.getByRole("button", { name: "Toggle example loader" });
    await toggle.focus();
    await toggle.press("Space");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByLabel("Select an example", { exact: true })).toBeHidden();
    await toggle.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  }
});

test("the selected demo remains visible with forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/#formulation-kit");
  await page.getByRole("button", { name: "Playground options" }).click();
  const active = page.getByRole("menuitemradio", { name: "M3DISEEN" });
  await expect(active).toHaveAttribute("aria-checked", "true");
  const colors = await active.evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.color, style.backgroundColor];
  });
  expect(colors[0]).not.toEqual(colors[1]);
});

test("the destructive material action stays readable across themes", async ({ page }) => {
  await page.goto("/#formulation-kit");
  await page.getByRole("button", { name: "Playground options" }).click();
  for (const theme of themes) {
    await page.getByLabel("Design system").selectOption(theme);
    for (const mode of ["light", "dark"]) {
      await page.getByLabel("Appearance").selectOption(mode);
      const ratio = await page
        .getByRole("button", { name: "Remove All", exact: true })
        .evaluate((el) => {
          const luminance = (color: string) => {
            const [r, g, b] = color
              .match(/[\d.]+/g)!
              .slice(0, 3)
              .map((channel) => {
                const v = Number(channel) / 255;
                return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
              });
            return r * 0.2126 + g * 0.7152 + b * 0.0722;
          };
          const style = getComputedStyle(el);
          const a = luminance(style.color),
            b = luminance(style.backgroundColor);
          return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        });
      expect(ratio, `${theme}/${mode}`).toBeGreaterThanOrEqual(4.5);
    }
  }
});
