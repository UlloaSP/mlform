// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it } from "vite-plus/test";
import {
  createDesignSystemRegistry,
  defineRecipe,
  defineTheme,
  mergeDesignSystemConfig,
  resolveDesignSystem,
} from "@/design-system";

describe("design-system", () => {
  it("resolves the builtin design-system defaults", () => {
    const resolved = resolveDesignSystem();

    expect(resolved.themeId).toBe("neutral");
    expect(resolved.recipeId).toBe("default");
    expect(resolved.requestedMode).toBe("auto");
    expect(resolved.effectiveScheme).toBe("light");
    expect(resolved.density).toBe("comfortable");
    expect(resolved.motion).toBe("subtle");
    expect(resolved.tokens["--mlf-hero-bg"]).toBeTruthy();
    expect(resolved.tokens["--mlf-submit-bg"]).toBeTruthy();
  });

  it("merges nested token and component overrides deterministically", () => {
    const merged = mergeDesignSystemConfig(
      {
        mode: "inherit",
        overrides: {
          density: "compact",
          tokens: {
            "--mlf-color-accent": "#123456",
          },
          components: {
            submit: {
              tokens: {
                "--mlf-submit-bg": "#111111",
              },
            },
          },
        },
      },
      {
        overrides: {
          motion: "none",
          tokens: {
            "--mlf-color-text": "#abcdef",
          },
          components: {
            submit: {
              tokens: {
                "--mlf-submit-bg-hover": "#222222",
              },
            },
          },
        },
      },
    );

    expect(merged.mode).toBe("inherit");
    expect(merged.overrides?.density).toBe("compact");
    expect(merged.overrides?.motion).toBe("none");
    expect(merged.overrides?.tokens).toEqual({
      "--mlf-color-accent": "#123456",
      "--mlf-color-text": "#abcdef",
    });
    expect(merged.overrides?.components?.submit?.tokens).toEqual({
      "--mlf-submit-bg": "#111111",
      "--mlf-submit-bg-hover": "#222222",
    });
  });

  it("supports custom theme and recipe registration", () => {
    const registry = createDesignSystemRegistry();

    registry.registerTheme(
      defineTheme({
        id: "operator",
        label: "Operator",
        schemes: {
          light: {
            colorScheme: "light",
            tokens: {
              "--mlf-color-bg": "#f7f9ff",
              "--mlf-color-surface": "#ffffff",
              "--mlf-color-surface-muted": "#e9efff",
              "--mlf-color-surface-elevated": "#ffffff",
              "--mlf-color-text": "#16243a",
              "--mlf-color-text-muted": "#60728a",
              "--mlf-color-border": "#cfdaea",
              "--mlf-color-border-strong": "#b7c7dc",
              "--mlf-color-accent": "#0057d9",
              "--mlf-color-accent-hover": "#0043a8",
              "--mlf-color-accent-soft": "rgba(0, 87, 217, 0.12)",
              "--mlf-color-success": "#1f8a5b",
              "--mlf-color-warning": "#c17c1f",
              "--mlf-color-danger": "#be3a34",
              "--mlf-color-danger-soft": "rgba(190, 58, 52, 0.12)",
              "--mlf-color-focus-ring": "rgba(0, 87, 217, 0.24)",
              "--mlf-color-overlay": "rgba(255, 255, 255, 0.8)",
              "--mlf-color-hover-surface": "#dbe8ff",
              "--mlf-color-chart-track": "rgba(22, 36, 58, 0.12)",
            },
          },
        },
      }),
    );

    registry.registerRecipe(
      defineRecipe({
        id: "operator-soft",
        label: "Operator Soft",
        density: "spacious",
        motion: "standard",
        tokens: {
          "--mlf-shell-bg": "#fbfcff",
        },
      }),
    );

    const resolved = resolveDesignSystem(
      {
        theme: "operator",
        recipe: "operator-soft",
      },
      registry,
    );

    expect(resolved.themeId).toBe("operator");
    expect(resolved.recipeId).toBe("operator-soft");
    expect(resolved.density).toBe("spacious");
    expect(resolved.motion).toBe("standard");
    expect(resolved.tokens["--mlf-shell-bg"]).toBe("#fbfcff");
    expect(resolved.tokens["--mlf-color-accent"]).toBe("#0057d9");
  });
});
