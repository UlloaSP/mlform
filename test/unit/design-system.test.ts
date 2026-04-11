// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import {
  createDesignSystemStylesheet,
  createDesignSystemRegistry,
  defineComponentTokens,
  defineGlobalTokens,
  defineRecipe,
  defineTheme,
  mergeDesignSystemConfig,
  resolveDesignSystem,
  writeDesignSystemTokenDeclarations,
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
    const onWarning = vi.fn();
    const merged = mergeDesignSystemConfig(
      {
        mode: "inherit",
        strict: true,
        onWarning,
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
    expect(merged.strict).toBe(true);
    expect(merged.onWarning).toBe(onWarning);
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

  it("preserves documented token precedence across theme, recipe, and overrides", () => {
    const registry = createDesignSystemRegistry()
      .registerTheme(
        defineTheme({
          id: "precedence-theme",
          label: "Precedence Theme",
          sharedTokens: {
            "--mlf-shell-bg": "shared-shell",
            "--mlf-submit-bg": "shared-submit",
          },
          schemes: {
            light: {
              tokens: {
                "--mlf-shell-bg": "theme-shell",
                "--mlf-submit-bg": "theme-submit",
              },
            },
          },
        }),
      )
      .registerRecipe(
        defineRecipe({
          id: "precedence-recipe",
          label: "Precedence Recipe",
          density: "comfortable",
          motion: "subtle",
          tokens: {
            "--mlf-shell-bg": "recipe-shell",
            "--mlf-submit-bg": "recipe-submit",
          },
          components: {
            submit: {
              tokens: {
                "--mlf-submit-bg": "recipe-component-submit",
              },
            },
          },
        }),
      );

    const resolved = resolveDesignSystem(
      {
        theme: "precedence-theme",
        recipe: "precedence-recipe",
        overrides: {
          tokens: {
            "--mlf-shell-bg": "override-shell",
          },
          components: {
            submit: {
              tokens: {
                "--mlf-submit-bg": "override-component-submit",
              },
            },
          },
        },
      },
      registry,
    );

    expect(resolved.tokens["--mlf-shell-bg"]).toBe("override-shell");
    expect(resolved.tokens["--mlf-submit-bg"]).toBe("override-component-submit");
    expect(resolved.components.submit.tokens["--mlf-submit-bg"]).toBe("override-component-submit");
  });

  it("keeps precedence stable across sparse layer combinations", () => {
    for (let mask = 0; mask < 128; mask += 1) {
      const shared = mask & 1 ? `shared-${mask}` : undefined;
      const theme = mask & 2 ? `theme-${mask}` : undefined;
      const recipe = mask & 4 ? `recipe-${mask}` : undefined;
      const recipeComponent = mask & 8 ? `recipe-component-${mask}` : undefined;
      const override = mask & 16 ? `override-${mask}` : undefined;
      const overrideComponent = mask & 32 ? `override-component-${mask}` : undefined;
      const systemDark = Boolean(mask & 64);

      const registry = createDesignSystemRegistry()
        .registerTheme(
          defineTheme({
            id: `matrix-theme-${mask}`,
            label: `Matrix Theme ${mask}`,
            sharedTokens: shared ? { "--mlf-submit-bg": shared } : undefined,
            schemes: {
              light: {
                tokens: theme ? { "--mlf-submit-bg": theme } : {},
              },
              ...(systemDark
                ? {
                    dark: {
                      tokens: theme ? { "--mlf-submit-bg": `${theme}-dark` } : {},
                    },
                  }
                : {}),
            },
          }),
        )
        .registerRecipe(
          defineRecipe({
            id: `matrix-recipe-${mask}`,
            label: `Matrix Recipe ${mask}`,
            density: "comfortable",
            motion: "subtle",
            tokens: recipe ? { "--mlf-submit-bg": recipe } : undefined,
            components: recipeComponent
              ? {
                  submit: {
                    tokens: {
                      "--mlf-submit-bg": recipeComponent,
                    },
                  },
                }
              : undefined,
          }),
        );

      const resolved = resolveDesignSystem(
        {
          theme: `matrix-theme-${mask}`,
          recipe: `matrix-recipe-${mask}`,
          overrides: {
            tokens: override ? { "--mlf-submit-bg": override } : undefined,
            components: overrideComponent
              ? {
                  submit: {
                    tokens: {
                      "--mlf-submit-bg": overrideComponent,
                    },
                  },
                }
              : undefined,
          },
        },
        registry,
        {
          systemScheme: systemDark ? "dark" : "light",
        },
      );

      expect(resolved.tokens["--mlf-submit-bg"]).toBe(
        overrideComponent ??
          override ??
          recipeComponent ??
          recipe ??
          (systemDark && theme ? `${theme}-dark` : theme) ??
          shared ??
          resolved.components.submit.tokens["--mlf-submit-bg"],
      );
    }
  });

  it("falls back to light scheme when auto mode resolves dark for a light-only theme", () => {
    const registry = createDesignSystemRegistry().registerTheme(
      defineTheme({
        id: "light-only",
        label: "Light Only",
        schemes: {
          light: {
            tokens: {
              "--mlf-color-bg": "#ffffff",
            },
          },
        },
      }),
    );

    const resolved = resolveDesignSystem(
      {
        theme: "light-only",
        mode: "auto",
      },
      registry,
      {
        systemScheme: "dark",
      },
    );

    expect(resolved.effectiveScheme).toBe("light");
    expect(resolved.effectiveModeSource).toBe("theme-fallback");
    expect(resolved.tokens["--mlf-color-bg"]).toBe("#ffffff");
  });

  it("falls back to light scheme when inherit mode resolves dark for a light-only theme", () => {
    const registry = createDesignSystemRegistry().registerTheme(
      defineTheme({
        id: "light-only",
        label: "Light Only",
        schemes: {
          light: {
            tokens: {
              "--mlf-color-bg": "#ffffff",
            },
          },
        },
      }),
    );

    const resolved = resolveDesignSystem(
      {
        theme: "light-only",
        mode: "inherit",
      },
      registry,
      {
        inheritedScheme: "dark",
        inheritedSource: "host-attribute",
      },
    );

    expect(resolved.effectiveScheme).toBe("light");
    expect(resolved.effectiveModeSource).toBe("theme-fallback");
    expect(resolved.tokens["--mlf-color-bg"]).toBe("#ffffff");
  });

  it("surfaces resolver warnings for unknown ids and unknown token keys", () => {
    const warnings = [] as string[];

    const resolved = resolveDesignSystem(
      {
        theme: "missing-theme",
        recipe: "missing-recipe",
        overrides: {
          tokens: {
            "--mlf-unknown-token": "#123456",
            "--custom-host-token": "#abcdef",
          },
        },
        onWarning(warning) {
          warnings.push(warning.message);
        },
      },
      createDesignSystemRegistry(),
    );

    expect(resolved.themeId).toBe("neutral");
    expect(resolved.recipeId).toBe("default");
    expect(resolved.warnings.map((warning) => warning.code)).toEqual([
      "unknown-theme-id",
      "unknown-recipe-id",
      "unknown-token-key",
    ]);
    expect(warnings).toHaveLength(3);
  });

  it("warns when component buckets contain tokens owned by another component", () => {
    const warnings = [] as string[];

    const resolved = resolveDesignSystem({
      overrides: {
        components: {
          field: {
            tokens: {
              "--mlf-submit-bg": "#101010",
            },
          },
        },
      },
      onWarning(warning) {
        warnings.push(warning.code);
      },
    });

    expect(resolved.warnings.map((warning) => warning.code)).toContain("misplaced-component-token");
    expect(warnings).toContain("misplaced-component-token");
  });

  it("throws in strict mode when resolver warnings exist", () => {
    expect(() =>
      resolveDesignSystem({
        strict: true,
        theme: "missing-theme",
      }),
    ).toThrowError(/Unknown theme "missing-theme"/i);
  });

  it("throws in strict mode when component ownership is violated", () => {
    expect(() =>
      resolveDesignSystem({
        strict: true,
        overrides: {
          components: {
            field: {
              tokens: {
                "--mlf-submit-bg": "#101010",
              },
            },
          },
        },
      }),
    ).toThrowError(/does not belong to component "field"/i);
  });

  it("rejects unsafe selectors and token values when creating a stylesheet", () => {
    const resolved = resolveDesignSystem();

    expect(() =>
      createDesignSystemStylesheet(resolved, ":host} body { color: red; /*"),
    ).toThrowError(/unsafe characters/i);

    expect(() =>
      createDesignSystemStylesheet({
        ...resolved,
        tokens: {
          ...resolved.tokens,
          "--mlf-color-bg": "red; color: hotpink",
        },
      }),
    ).toThrowError(/unsafe stylesheet characters/i);
  });

  it("writes validated token declarations directly to a style target", () => {
    const resolved = resolveDesignSystem();
    const host = document.createElement("div");

    const applied = writeDesignSystemTokenDeclarations(host.style, resolved);

    expect(applied.has("--mlf-color-bg")).toBe(true);
    expect(host.style.getPropertyValue("--mlf-color-bg")).toBe(resolved.tokens["--mlf-color-bg"]);
  });

  it("provides strict authoring helpers for global and component tokens", () => {
    expect(
      defineGlobalTokens({
        "--mlf-color-accent": "#0057d9",
      }),
    ).toEqual({
      "--mlf-color-accent": "#0057d9",
    });

    expect(
      defineComponentTokens("submit", {
        "--mlf-submit-bg": "#0057d9",
      }),
    ).toEqual({
      tokens: {
        "--mlf-submit-bg": "#0057d9",
      },
    });

    expect(() =>
      defineGlobalTokens({
        "--mlf-submit-bg": "#0057d9",
      } as never),
    ).toThrowError(/belongs to component "submit"/i);

    expect(() =>
      defineComponentTokens("field", {
        "--mlf-submit-bg": "#0057d9",
      } as never),
    ).toThrowError(/does not belong to component "field"/i);
  });
});
