// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import {
  attachDesignSystem,
  createDesignSystemStylesheet,
  createDesignSystemRegistry,
  defineComponentTokens,
  defineGlobalTokens,
  defineRecipe,
  defineTheme,
  getResolvedDesignSystemHostAttributes,
  hydrateDesignSystem,
  mergeDesignSystemConfig,
  migrateTokens,
  migrateThemeTokens,
  resolveDesignSystem,
  writeDesignSystemTokenDeclarations,
} from "@/design-system";
import type { ResolvedDesignSystem } from "@/design-system";

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

  it("applies prefers-contrast overrides when prefersMoreContrast is true", () => {
    const contrast = resolveDesignSystem({}, undefined, { prefersMoreContrast: true });

    expect(contrast.density).toBe("spacious");
    expect(contrast.tokens["--mlf-border-width"]).toBe("1.5px");
    expect(contrast.tokens["--mlf-ring-width"]).toBe("5px");

    // Explicit override takes precedence over prefers-contrast
    const overridden = resolveDesignSystem({ overrides: { density: "compact" } }, undefined, {
      prefersMoreContrast: true,
    });
    expect(overridden.density).toBe("compact");
  });

  it("wraps stylesheet in @layer when layer option is provided", () => {
    const resolved = resolveDesignSystem();

    const plain = createDesignSystemStylesheet(resolved, ":root");
    expect(plain).not.toContain("@layer");

    const layered = createDesignSystemStylesheet(resolved, {
      selector: ":root",
      layer: "mlform.tokens",
    });
    expect(layered).toMatch(/^@layer mlform.tokens \{/);
    expect(layered).toContain(":root {");

    // Default selector when using options object
    const defaultSelector = createDesignSystemStylesheet(resolved, {
      layer: "design",
    });
    expect(defaultSelector).toContain(":host {");
  });

  it("rejects unsafe layer names in stylesheet generation", () => {
    const resolved = resolveDesignSystem();

    expect(() => createDesignSystemStylesheet(resolved, { layer: "bad { injection" })).toThrowError(
      /unsafe characters/i,
    );
    expect(() => createDesignSystemStylesheet(resolved, { layer: "1bad-layer" })).toThrowError(
      /valid css layer name/i,
    );
    expect(() => createDesignSystemStylesheet(resolved, { layer: "good..bad" })).toThrowError(
      /valid css layer name/i,
    );
  });

  it("fires onChange events when themes and recipes are registered or removed", () => {
    const events: Array<{ type: string; id: string }> = [];
    const registry = createDesignSystemRegistry();
    const unsub = registry.onChange((event) => events.push(event));

    registry.registerTheme(
      defineTheme({
        id: "test-theme",
        label: "Test",
        schemes: { light: { tokens: { "--mlf-color-bg": "#fff" } } },
      }),
    );

    registry.registerRecipe(
      defineRecipe({
        id: "test-recipe",
        label: "Test",
        density: "comfortable",
        motion: "subtle",
      }),
    );

    registry.removeTheme("test-theme");
    registry.removeRecipe("test-recipe");
    registry.removeTheme("nonexistent"); // should not fire

    expect(events).toEqual([
      { type: "theme-registered", id: "test-theme" },
      { type: "recipe-registered", id: "test-recipe" },
      { type: "theme-removed", id: "test-theme" },
      { type: "recipe-removed", id: "test-recipe" },
    ]);

    // Unsubscribe stops events
    unsub();
    registry.registerTheme(
      defineTheme({
        id: "post-unsub",
        label: "Post",
        schemes: { light: { tokens: { "--mlf-color-bg": "#000" } } },
      }),
    );
    expect(events).toHaveLength(4);
  });

  it("cloned registry does not share change listeners", () => {
    const events: string[] = [];
    const registry = createDesignSystemRegistry();
    registry.onChange((event) => events.push(event.id));

    const clone = registry.clone();
    clone.registerTheme(
      defineTheme({
        id: "clone-theme",
        label: "Clone",
        schemes: { light: { tokens: { "--mlf-color-bg": "#fff" } } },
      }),
    );

    expect(events).toHaveLength(0);
  });

  it("component token defaults use var() references instead of hardcoded light-mode colors", () => {
    const resolved = resolveDesignSystem();
    const fieldBg = resolved.tokens["--mlf-field-bg"];
    const heroBg = resolved.tokens["--mlf-hero-bg"];
    const reportBg = resolved.tokens["--mlf-report-bg"];
    const errorBg = resolved.tokens["--mlf-error-bg"];
    const shellOverlay = resolved.tokens["--mlf-shell-overlay"];

    // None should contain hardcoded rgba(255, 255, 255, ...) or rgba(248, 250, 253, ...)
    for (const [name, value] of [
      ["field-bg", fieldBg],
      ["hero-bg", heroBg],
      ["report-bg", reportBg],
      ["error-bg", errorBg],
      ["shell-overlay", shellOverlay],
    ]) {
      expect(value, `${name} should not contain hardcoded white rgba`).not.toMatch(
        /rgba\(255,\s*255,\s*255/,
      );
      expect(value, `${name} should not contain hardcoded light-mode rgba`).not.toMatch(
        /rgba\(24[5-8],\s*2[45]\d,\s*25[0-3]/,
      );
      expect(value, `${name} should not contain hardcoded rgba(247`).not.toMatch(/rgba\(247/);
    }

    // All should use var() or color-mix references
    for (const value of [fieldBg, heroBg, reportBg, errorBg, shellOverlay]) {
      expect(value).toContain("var(--mlf-");
    }
  });

  it("hydrateDesignSystem attaches to a pre-rendered host and takes over reactivity", () => {
    const host = document.createElement("div");
    host.setAttribute("data-mlf-theme-id", "cobalt");
    host.style.setProperty("--mlf-color-accent", "#1f5eff");
    document.body.append(host);

    const ds = hydrateDesignSystem(host, {
      config: { theme: "cobalt" },
    });

    expect(ds.resolved).not.toBeNull();
    expect(ds.resolved!.themeId).toBe("cobalt");
    expect(host.getAttribute("data-mlf-theme-id")).toBe("cobalt");

    ds.update({ theme: "neutral" });
    expect(ds.resolved!.themeId).toBe("neutral");

    ds.disconnect();
    host.remove();
  });

  it("hydrateDesignSystem reuses matching SSR state without initial re-apply", () => {
    const host = document.createElement("div");
    const resolved = resolveDesignSystem({ theme: "cobalt", recipe: "soft" });
    document.body.append(host);
    host.style.colorScheme = resolved.effectiveScheme;
    for (const [attribute, value] of Object.entries(
      getResolvedDesignSystemHostAttributes(resolved),
    )) {
      host.setAttribute(attribute, value);
    }
    writeDesignSystemTokenDeclarations(host.style, resolved);

    const onChange = vi.fn();
    const ds = hydrateDesignSystem(host, {
      config: { theme: "cobalt", recipe: "soft" },
      onChange,
    });

    expect(ds.resolved).not.toBeNull();
    expect(ds.resolved!.themeId).toBe("cobalt");
    expect(ds.resolved!.recipeId).toBe("soft");
    expect(onChange).not.toHaveBeenCalled();

    ds.update({ theme: "neutral" });
    expect(ds.resolved!.themeId).toBe("neutral");

    ds.disconnect();
    host.remove();
  });

  it("hydrateDesignSystem reuses stylesheet-backed SSR tokens without initial re-apply", () => {
    const host = document.createElement("div");
    host.id = "ssr-design-system-host";
    const resolved = resolveDesignSystem({ theme: "cobalt", recipe: "soft" });
    const style = document.createElement("style");
    style.textContent = createDesignSystemStylesheet(resolved, "#ssr-design-system-host");
    document.head.append(style);
    document.body.append(host);
    host.style.colorScheme = resolved.effectiveScheme;
    for (const [attribute, value] of Object.entries(
      getResolvedDesignSystemHostAttributes(resolved),
    )) {
      host.setAttribute(attribute, value);
    }

    const onChange = vi.fn();
    const ds = hydrateDesignSystem(host, {
      config: { theme: "cobalt", recipe: "soft" },
      onChange,
    });

    expect(ds.resolved).not.toBeNull();
    expect(ds.resolved!.themeId).toBe("cobalt");
    expect(getComputedStyle(host).getPropertyValue("--mlf-color-bg").trim()).toBe(
      resolved.tokens["--mlf-color-bg"],
    );
    expect(onChange).not.toHaveBeenCalled();

    ds.disconnect();
    style.remove();
    host.remove();
  });

  it("refreshes when inline theme and recipe manifests change without changing ids", () => {
    const host = document.createElement("div");
    document.body.append(host);

    const ds = attachDesignSystem(host, {
      config: {
        theme: defineTheme({
          id: "inline",
          label: "Inline",
          schemes: {
            light: {
              tokens: {
                "--mlf-color-bg": "#111111",
                "--mlf-color-text": "#f7f7f7",
              },
            },
          },
        }),
        recipe: defineRecipe({
          id: "inline-recipe",
          label: "Inline Recipe",
          density: "compact",
          motion: "subtle",
          tokens: {
            "--mlf-shell-bg": "#222222",
          },
        }),
      },
    });

    expect(host.style.getPropertyValue("--mlf-color-bg")).toBe("#111111");
    expect(host.style.getPropertyValue("--mlf-shell-bg")).toBe("#222222");
    expect(ds.resolved?.density).toBe("compact");

    ds.replace({
      theme: defineTheme({
        id: "inline",
        label: "Inline",
        schemes: {
          light: {
            tokens: {
              "--mlf-color-bg": "#ffffff",
              "--mlf-color-text": "#111111",
            },
          },
        },
      }),
      recipe: defineRecipe({
        id: "inline-recipe",
        label: "Inline Recipe",
        density: "spacious",
        motion: "standard",
        tokens: {
          "--mlf-shell-bg": "#eeeeee",
        },
      }),
    });

    expect(host.style.getPropertyValue("--mlf-color-bg")).toBe("#ffffff");
    expect(host.style.getPropertyValue("--mlf-shell-bg")).toBe("#eeeeee");
    expect(ds.resolved?.density).toBe("spacious");
    expect(ds.resolved?.motion).toBe("standard");

    ds.disconnect();
    host.remove();
  });

  it("applies variant and signature host attributes for resolved state", () => {
    const host = document.createElement("div");
    document.body.append(host);

    const registry = createDesignSystemRegistry().registerTheme(
      defineTheme({
        id: "variant-host-state",
        label: "Variant Host State",
        schemes: {
          light: { tokens: { "--mlf-color-bg": "#fff", "--mlf-color-text": "#111" } },
          dark: { tokens: { "--mlf-color-bg": "#000", "--mlf-color-text": "#eee" } },
        },
        variants: {
          "high-contrast-light": {
            baseScheme: "light",
            tokens: { "--mlf-color-text": "#000" },
          },
        },
      }),
    );

    const ds = attachDesignSystem(host, {
      config: { theme: "variant-host-state", variant: "high-contrast-light", mode: "light" },
      registry,
    });

    expect(host.getAttribute("data-mlf-variant-id")).toBe("high-contrast-light");
    expect(host.getAttribute("data-mlf-signature")).toBeTruthy();

    ds.update({ mode: "dark", variant: "high-contrast-light" });
    expect(host.getAttribute("data-mlf-variant-id")).toBeNull();
    expect(host.getAttribute("data-mlf-signature")).toBeTruthy();

    ds.disconnect();
    host.remove();
  });

  it("resolveComponentTokens uses single-pass bucketing correctly", () => {
    const resolved = resolveDesignSystem();

    // Every component should have its own tokens bucketed correctly
    for (const [key, config] of Object.entries(resolved.components)) {
      for (const token of Object.keys(config.tokens)) {
        expect(token, `${token} should belong to component ${key}`).toMatch(
          new RegExp(`^--mlf-${key}-`),
        );
      }
    }
  });

  it("falls back through registry before using hardcoded defaults", () => {
    const customNeutral = defineTheme({
      id: "neutral",
      label: "Custom Neutral",
      schemes: {
        light: {
          tokens: { "--mlf-color-bg": "#custom-neutral" },
        },
      },
    });

    const registry = createDesignSystemRegistry().registerTheme(customNeutral);

    // Request unknown theme — should fall back to registry's "neutral", not hardcoded
    const resolved = resolveDesignSystem({ theme: "nonexistent" }, registry);

    expect(resolved.tokens["--mlf-color-bg"]).toBe("#custom-neutral");
  });

  it("applies forced-colors system color overrides when forcedColors is true", () => {
    const resolved = resolveDesignSystem({}, undefined, { forcedColors: true });

    expect(resolved.tokens["--mlf-color-bg"]).toBe("Canvas");
    expect(resolved.tokens["--mlf-color-text"]).toBe("CanvasText");
    expect(resolved.tokens["--mlf-color-accent"]).toBe("LinkText");
    expect(resolved.tokens["--mlf-color-border"]).toBe("ButtonBorder");
    expect(resolved.tokens["--mlf-shadow-sm"]).toBe("none");
    expect(resolved.tokens["--mlf-shadow-md"]).toBe("none");
    expect(resolved.tokens["--mlf-shadow-lg"]).toBe("none");
    expect(resolved.tokens["--mlf-border-width"]).toBe("2px");
  });

  it("forced-colors override consumer overrides (accessibility mandate)", () => {
    const resolved = resolveDesignSystem(
      {
        overrides: {
          tokens: {
            "--mlf-color-bg": "#custom-bg",
            "--mlf-shadow-md": "0 10px 20px black",
          },
        },
      },
      undefined,
      { forcedColors: true },
    );

    // Forced colors must win over consumer overrides
    expect(resolved.tokens["--mlf-color-bg"]).toBe("Canvas");
    expect(resolved.tokens["--mlf-shadow-md"]).toBe("none");
  });

  it("resolves theme variants for multi-scheme support", () => {
    const registry = createDesignSystemRegistry().registerTheme(
      defineTheme({
        id: "multi",
        label: "Multi",
        schemes: {
          light: { tokens: { "--mlf-color-bg": "#ffffff", "--mlf-color-text": "#111" } },
          dark: { tokens: { "--mlf-color-bg": "#000000", "--mlf-color-text": "#eee" } },
        },
        variants: {
          "high-contrast-light": {
            baseScheme: "light",
            tokens: { "--mlf-color-text": "#000000", "--mlf-color-border": "#000000" },
          },
          "high-contrast-dark": {
            baseScheme: "dark",
            tokens: { "--mlf-color-text": "#ffffff", "--mlf-color-border": "#ffffff" },
          },
        },
      }),
    );

    // Explicit variant
    const hcLight = resolveDesignSystem(
      { theme: "multi", variant: "high-contrast-light", mode: "light" },
      registry,
    );
    expect(hcLight.variant).toBe("high-contrast-light");
    expect(hcLight.tokens["--mlf-color-bg"]).toBe("#ffffff");
    expect(hcLight.tokens["--mlf-color-text"]).toBe("#000000");
    expect(hcLight.tokens["--mlf-color-border"]).toBe("#000000");

    // Auto-select high-contrast variant when prefers-contrast active
    const autoHc = resolveDesignSystem({ theme: "multi", mode: "dark" }, registry, {
      prefersMoreContrast: true,
      systemScheme: "dark",
    });
    expect(autoHc.variant).toBe("high-contrast-dark");
    expect(autoHc.tokens["--mlf-color-text"]).toBe("#ffffff");
    expect(autoHc.tokens["--mlf-color-border"]).toBe("#ffffff");

    // No variant when theme has no matching variant
    const noVariant = resolveDesignSystem({ theme: "multi", mode: "light" }, registry);
    expect(noVariant.variant).toBeNull();
    expect(noVariant.tokens["--mlf-color-text"]).toBe("#111");
  });

  it("warns and ignores explicit variants that target a different base scheme", () => {
    const warnings: string[] = [];
    const registry = createDesignSystemRegistry().registerTheme(
      defineTheme({
        id: "variant-mismatch",
        label: "Variant Mismatch",
        schemes: {
          light: { tokens: { "--mlf-color-bg": "#fff", "--mlf-color-text": "#111" } },
          dark: { tokens: { "--mlf-color-bg": "#000", "--mlf-color-text": "#eee" } },
        },
        variants: {
          "light-only": {
            baseScheme: "light",
            tokens: { "--mlf-color-text": "#123456" },
          },
        },
      }),
    );

    const resolved = resolveDesignSystem(
      {
        theme: "variant-mismatch",
        variant: "light-only",
        mode: "dark",
        onWarning: (warning) => warnings.push(warning.message),
      },
      registry,
    );

    expect(resolved.variant).toBeNull();
    expect(resolved.tokens["--mlf-color-text"]).toBe("#eee");
    expect(warnings[0]).toMatch(/variant was ignored/i);
  });

  it("mergeDesignSystemConfig preserves variant", () => {
    const merged = mergeDesignSystemConfig({ variant: "high-contrast-light" }, { mode: "dark" });
    expect(merged.variant).toBe("high-contrast-light");

    const overridden = mergeDesignSystemConfig(
      { variant: "high-contrast-light" },
      { variant: "high-contrast-dark" },
    );
    expect(overridden.variant).toBe("high-contrast-dark");
  });

  it("migrateTokens renames token keys", () => {
    const tokens = {
      "--mlf-color-primary": "#0057d9",
      "--mlf-color-text": "#111",
    };

    const migrated = migrateTokens(tokens, [
      { from: "--mlf-color-primary", to: "--mlf-color-accent" },
    ]);

    expect(migrated).toEqual({
      "--mlf-color-accent": "#0057d9",
      "--mlf-color-text": "#111",
    });
    expect(migrated).not.toHaveProperty("--mlf-color-primary");
  });

  it("migrateTokens does not clobber: first writer wins when both from and to exist", () => {
    const tokens = {
      "--mlf-color-primary": "#old",
      "--mlf-color-accent": "#new",
    };

    const migrated = migrateTokens(tokens, [
      { from: "--mlf-color-primary", to: "--mlf-color-accent" },
    ]);

    // "from" key is renamed to "to" first in iteration order; the existing
    // "to" value is then dropped because the target key already exists.
    expect(migrated["--mlf-color-accent"]).toBe("#old");
    expect(Object.keys(migrated)).toHaveLength(1);
  });

  it("migrateTokens passes source and target values to custom conflict handlers in stable order", () => {
    const tokens = {
      "--mlf-color-accent": "#target-first",
      "--mlf-color-primary": "#source-second",
    };

    const conflict = vi.fn((sourceValue: string, targetValue: string) => {
      return `${sourceValue}|${targetValue}`;
    });

    const migrated = migrateTokens(
      tokens,
      [{ from: "--mlf-color-primary", to: "--mlf-color-accent" }],
      conflict,
    );

    expect(conflict).toHaveBeenCalledWith("#source-second", "#target-first", "--mlf-color-accent");
    expect(migrated["--mlf-color-accent"]).toBe("#source-second|#target-first");
  });

  it("migrateThemeTokens applies migrations to all scheme slots", () => {
    const theme = {
      id: "legacy",
      label: "Legacy",
      schemes: {
        light: { tokens: { "--mlf-old-token": "#aaa" } },
        dark: { tokens: { "--mlf-old-token": "#bbb" } },
      },
      sharedTokens: { "--mlf-old-shared": "#ccc" },
    };

    const migrated = migrateThemeTokens(theme, [
      { from: "--mlf-old-token", to: "--mlf-new-token" },
      { from: "--mlf-old-shared", to: "--mlf-new-shared" },
    ]);

    expect(migrated.schemes.light.tokens).toEqual({ "--mlf-new-token": "#aaa" });
    expect(migrated.schemes.dark!.tokens).toEqual({ "--mlf-new-token": "#bbb" });
    expect(migrated.sharedTokens).toEqual({ "--mlf-new-shared": "#ccc" });
  });

  it("controller auto-refreshes when registry entries change", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const registry = createDesignSystemRegistry().registerTheme(
      defineTheme({
        id: "neutral",
        label: "Neutral",
        schemes: { light: { tokens: { "--mlf-color-bg": "#fff" } } },
      }),
    );

    const changes: string[] = [];
    const ds = attachDesignSystem(host, {
      config: { theme: "neutral" },
      registry,
      onChange: (resolved: ResolvedDesignSystem) => changes.push(resolved.themeId),
    });

    // attachDesignSystem clones the registry — use the attached clone
    ds.registry.registerTheme(
      defineTheme({
        id: "neutral",
        label: "Neutral v2",
        schemes: { light: { tokens: { "--mlf-color-bg": "#fefefe" } } },
      }),
    );

    expect(host.style.getPropertyValue("--mlf-color-bg")).toBe("#fefefe");

    ds.disconnect();
    host.remove();
  });

  it("aborts stale custom transitions so late applies cannot clobber newer state", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const queued: Array<{ apply: () => void; signal: AbortSignal }> = [];

    const ds = attachDesignSystem(host, {
      config: { theme: "neutral" },
      transition: (apply, context) => {
        queued.push({ apply, signal: context.signal });
      },
    });

    expect(queued).toHaveLength(1);
    ds.update({ theme: "cobalt" });

    expect(queued).toHaveLength(2);
    expect(queued[0].signal.aborted).toBe(true);

    queued[0].apply();
    expect(host.getAttribute("data-mlf-theme-id")).toBeNull();

    queued[1].apply();
    expect(host.getAttribute("data-mlf-theme-id")).toBe("cobalt");

    ds.disconnect();
    host.remove();
  });

  it("ignores stale view-transition callbacks when newer updates supersede them", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const callbacks: Array<() => void> = [];
    const doc = host.ownerDocument as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };
    const originalStartViewTransition = doc.startViewTransition;
    Object.defineProperty(doc, "startViewTransition", {
      configurable: true,
      value: (callback: () => void) => {
        callbacks.push(callback);
        return { finished: Promise.resolve() };
      },
    });

    const ds = attachDesignSystem(host, {
      config: { theme: "neutral" },
      transition: "view-transition",
    });

    expect(callbacks).toHaveLength(1);
    ds.update({ theme: "cobalt" });
    expect(callbacks).toHaveLength(2);

    callbacks[0]();
    expect(host.getAttribute("data-mlf-theme-id")).toBeNull();

    callbacks[1]();
    expect(host.getAttribute("data-mlf-theme-id")).toBe("cobalt");

    ds.disconnect();
    Object.defineProperty(doc, "startViewTransition", {
      configurable: true,
      value: originalStartViewTransition,
    });
    host.remove();
  });

  it("resolved.variant is null when no variant is active", () => {
    const resolved = resolveDesignSystem();
    expect(resolved.variant).toBeNull();
  });

  it("warns for unknown tokens declared inside theme variants", () => {
    const warnings: string[] = [];

    resolveDesignSystem(
      {
        theme: defineTheme({
          id: "variant-warning-theme",
          label: "Variant Warning Theme",
          schemes: {
            light: {
              tokens: { "--mlf-color-bg": "#fff" },
            },
          },
          variants: {
            "high-contrast-light": {
              baseScheme: "light",
              tokens: {
                "--mlf-unknown-variant-token": "#000",
              },
            },
          },
        }),
        onWarning: (warning) => warnings.push(warning.path ?? ""),
      },
      createDesignSystemRegistry(),
    );

    expect(warnings).toContain('theme "variant-warning-theme".variants.high-contrast-light.tokens');
  });

  it("removeTheme clears queued variants registered before the theme exists", () => {
    const registry = createDesignSystemRegistry();
    registry.registerVariant("queued-theme", "high-contrast-light", {
      baseScheme: "light",
      tokens: { "--mlf-color-text": "#000" },
    });

    registry.removeTheme("queued-theme");
    registry.registerTheme(
      defineTheme({
        id: "queued-theme",
        label: "Queued Theme",
        schemes: {
          light: {
            tokens: { "--mlf-color-bg": "#fff", "--mlf-color-text": "#111" },
          },
        },
      }),
    );

    expect(registry.getTheme("queued-theme")?.variants).toBeUndefined();
  });
});
