import type { KitHost } from "./browser-types.ts";
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
const recipes = ["default", "minimal", "soft", "contrast"];

for (const theme of themes) {
  test(`${theme} retains control focus, units and surfaces in every recipe and scheme`, async ({
    page,
  }) => {
    await page.goto("/#tabs-classic");
    await page.getByRole("button", { name: "Playground options" }).click();
    await page.getByLabel("Design system").selectOption(theme);
    for (const mode of ["light", "dark"]) {
      for (const recipe of recipes) {
        await page.getByLabel("Appearance").selectOption(mode);
        await page.getByLabel("Style").selectOption(recipe);
        const host = page.locator("mlf-kit-tabs");
        await expect(host).toHaveAttribute("data-mlf-effective-scheme", mode);
        await expect(host).toHaveAttribute("data-mlf-recipe-id", recipe);
        const field = page
          .locator("mlf-field-frame")
          .filter({ has: page.getByLabel("Training epochs", { exact: true }) });
        const tile = field.locator(".tile");
        const settleStyle = async (el: Element) => {
          void getComputedStyle(el).borderColor;
          await Promise.allSettled(el.getAnimations().map((animation) => animation.finished));
        };
        const appearance = (el: Element) => {
          const css = getComputedStyle(el);
          return [css.backgroundColor, css.backgroundImage, css.borderColor, css.boxShadow];
        };
        await tile.evaluate(settleStyle);
        const before = await tile.evaluate(appearance);
        await page.getByLabel("Training epochs", { exact: true }).focus();
        await expect(page.getByLabel("Training epochs", { exact: true })).toBeFocused();
        await tile.evaluate(settleStyle);
        expect(await tile.evaluate(appearance), `${mode}/${recipe} frame focus`).toEqual(before);
        expect(
          await field.locator(".unit").evaluate((unit) => {
            const rect = unit.getBoundingClientRect();
            const input = unit.previousElementSibling!.getBoundingClientRect();
            return (
              rect.top >= input.top &&
              rect.bottom <= input.bottom &&
              unit.scrollHeight <= unit.clientHeight
            );
          }),
          `${mode}/${recipe} unit clipping`,
        ).toBe(true);
        if (recipe === "soft") expect(before[1]).toContain("linear-gradient");
      }
    }
  });
}

test("Series has room for its focus ring at narrow and wide widths", async ({ page }) => {
  await page.goto("/#field-combinations");
  for (const width of [320, 390, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const series of await page
      .locator('[data-role="field-combos-form"] mlf-series-field')
      .filter({ has: page.locator('input[role="spinbutton"]:enabled:not([readonly])') })
      .all()) {
      const input = series.getByRole("spinbutton").first();
      await input.focus();
      const singleColumn = await series.locator('.grid[data-columns="1"]').count();
      if (singleColumn) {
        expect(
          await input.evaluate((element) => {
            const remove = (element.getRootNode() as ShadowRoot).querySelector(".remove-btn")!;
            // Read both bounds together while focus may still be scrolling the document.
            return Math.abs(element.getBoundingClientRect().y - remove.getBoundingClientRect().y);
          }),
          `${width}px remove alignment`,
        ).toBeLessThan(1);
      }
      expect(
        await input.evaluate((input) => {
          const grid = (input.getRootNode() as ShadowRoot)
            .querySelector(".grid")!
            .getBoundingClientRect();
          const rect = input.getBoundingClientRect();
          return (
            rect.left - grid.left >= 3 && grid.right - rect.right >= 3 && rect.top - grid.top >= 3
          );
        }),
        `${width}px`,
      ).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

test("forced colors preserve boolean selection, focus and the menu icon", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/#tabs-classic");
  const selected = page.getByRole("radio", { name: "Approved", exact: true });
  await selected.focus();
  const appearance = await selected.evaluate((radio) => {
    const chosen = getComputedStyle(radio.nextElementSibling!);
    const other = getComputedStyle(
      radio.parentElement!.querySelector("input:not(:checked) + label")!,
    );
    return {
      chosen: chosen.backgroundColor,
      other: other.backgroundColor,
      text: chosen.color,
      outline: chosen.outlineStyle,
      offset: chosen.outlineOffset,
    };
  });
  expect(appearance.chosen).not.toBe(appearance.other);
  expect(appearance.chosen).not.toBe(appearance.text);
  expect(appearance.outline).toBe("solid");
  expect(parseFloat(appearance.offset)).toBeGreaterThan(0);
  await expect(page.locator(".app-menu-button svg path")).toBeVisible();
  expect(
    await page.locator(".app-menu-button svg").evaluate((el) => getComputedStyle(el).stroke),
  ).not.toBe("none");
  await selected.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Blocked", exact: true })).toBeChecked();
});

for (const reduced of [false, true]) {
  test(`feedback reserves space and ${reduced ? "respects reduced motion" : "animates wrapped errors"}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
    await page.goto("/#tabs-classic");
    const field = page.locator("mlf-field-frame").first();
    const initial = await field
      .locator(".tile")
      .evaluate((el) => el.getBoundingClientRect().height);
    await page.getByLabel("Release name", { exact: true }).fill("A valid release");
    await expect(field.locator(".feedback.success")).toBeVisible();
    expect(await field.locator(".tile").evaluate((el) => el.getBoundingClientRect().height)).toBe(
      initial,
    );
    // Record real browser animations while preserving the platform implementation.
    await page.evaluate(() => {
      window.auditAnimations = [];
      // oxlint-disable-next-line typescript/unbound-method -- Rebound to the animated element with .call below.
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (frames, options) {
        const animation = animate.call(this, frames, options);
        window.auditAnimations.push({
          element: this,
          animation,
          frames: !frames || Array.isArray(frames) ? {} : frames,
          options: typeof options === "number" ? { duration: options } : (options ?? {}),
        });
        return animation;
      };
    });
    await page.locator("mlf-kit-tabs").evaluate((host: KitHost) => {
      host.view.form.setExternalErrors({
        fields: {
          "release-name": [
            "This deliberately long validation message wraps across several lines so the field must expand progressively while keeping all of its text readable. ".repeat(
              5,
            ),
          ],
        },
      });
    });
    await expect(field.locator(".feedback.error")).toContainText("progressively");
    const animations = await page.evaluate(() =>
      window.auditAnimations.map(({ element, frames, options }) => ({
        target: element.className,
        frames,
        duration: options.duration,
      })),
    );
    if (reduced) {
      expect(animations).toEqual([]);
      expect(
        await field.locator("input").evaluate((el) => getComputedStyle(el).transitionDuration),
      ).toBe("0s");
    } else {
      const expansion = animations.find(
        (entry) => entry.target === "feedback error" && entry.frames.height,
      );
      expect(expansion).toBeTruthy();
      const heights = expansion!.frames.height;
      if (!Array.isArray(heights)) throw new Error("Expected height keyframes");
      expect(parseFloat(String(heights[1]))).toBeGreaterThan(parseFloat(String(heights[0])));
      expect(expansion!.duration).toBeGreaterThan(0);
      expect(animations.some((entry) => entry.frames.opacity)).toBe(true);
    }
    await expect
      .poll(() => field.locator(".feedback").evaluate((el) => el.clientHeight >= el.scrollHeight))
      .toBe(true);
    await field.locator(".help-btn").click();
    await expect(field.locator(".description")).toHaveAttribute("aria-hidden", "false");
    await expect
      .poll(() =>
        field.locator(".description").evaluate((el) => el.clientHeight >= el.scrollHeight),
      )
      .toBe(true);
  });
}
