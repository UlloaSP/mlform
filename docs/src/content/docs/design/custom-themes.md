---
title: Custom themes and recipes
description: Define your own color theme with light and dark schemes, or your own recipe for density, motion, and component chrome.
---

A **theme** carries color and typography tokens per scheme. A **recipe** carries density, motion,
and the shape of components. Keep brand colors in themes and structural choices in recipes, so
either can be swapped without the other.

## A custom theme

```ts
import { createBuiltinDesignSystemRegistry, defineGlobalTokens, defineTheme } from "mlform/design";

export const stationTheme = defineTheme({
  id: "station",
  label: "Station",
  sharedTokens: {
    "--mlf-font-family-body": "Inter, system-ui, sans-serif",
    "--mlf-font-family-ui": "Inter, system-ui, sans-serif",
  },
  schemes: {
    light: {
      tokens: defineGlobalTokens({
        "--mlf-color-bg": "#f8fafc",
        "--mlf-color-surface": "#ffffff",
        "--mlf-color-text": "#102033",
        "--mlf-color-accent": "#0f766e",
      }),
    },
    dark: {
      tokens: defineGlobalTokens({
        "--mlf-color-bg": "#08111f",
        "--mlf-color-surface": "#111827",
        "--mlf-color-text": "#f8fafc",
        "--mlf-color-accent": "#5eead4",
      }),
    },
  },
});

const designSystemRegistry = createBuiltinDesignSystemRegistry().registerTheme(stationTheme);

mountForm(container, {
  schema,
  transport,
  designSystemRegistry,
  designSystem: { theme: "station", recipe: "default" },
});
```

- `schemes.light` is required; `schemes.dark` is optional. Without it, dark mode uses the light
  tokens.
- `sharedTokens` apply to both schemes before scheme tokens; use them for fonts and radii.
- Tokens you leave out keep the built-in defaults listed in
  [Tokens and host styling](/design/tokens/#token-reference). Check contrast for every pair of text
  and surface colors you change.
- `defineGlobalTokens` and `defineComponentTokens` only add type checking for `--mlf-*` keys; plain
  objects work too.

Start from `createBuiltinDesignSystemRegistry()` so the built-in themes and recipes stay available.
`createDesignSystemRegistry()` returns an empty registry. You can also skip the registry and pass
the manifest itself: `designSystem: { theme: stationTheme }`.

### High-contrast variants

A theme can declare `variants`, each overlaying tokens on one base scheme. When the user prefers
more contrast and you have not chosen a variant, MLForm applies `high-contrast-light` or
`high-contrast-dark` if the theme defines it. Select any variant explicitly with
`designSystem.variant`, or add one to an existing theme with
`registry.registerVariant(themeId, variantId, variant)`.

```ts
variants: {
  "high-contrast-light": {
    baseScheme: "light",
    tokens: { "--mlf-color-border": "#1f2937", "--mlf-color-text-muted": "#1f2937" },
  },
},
```

## A custom recipe

```ts
import {
  createBuiltinDesignSystemRegistry,
  defineComponentTokens,
  defineGlobalTokens,
  defineRecipe,
} from "mlform/design";

export const consoleRecipe = defineRecipe({
  id: "console",
  label: "Console",
  density: "compact",
  motion: "subtle",
  tokens: defineGlobalTokens({ "--mlf-radius-md": "6px" }),
  components: {
    field: defineComponentTokens("field", { "--mlf-field-shadow": "none" }),
    submit: defineComponentTokens("submit", {
      "--mlf-submit-shadow": "none",
      "--mlf-submit-shadow-hover": "none",
    }),
  },
});

const designSystemRegistry = createBuiltinDesignSystemRegistry().registerRecipe(consoleRecipe);
```

`density` and `motion` are required. Recipe tokens override theme tokens; runtime `overrides` still
win over both.

## Registry lifetime

`mountForm` and `attachDesignSystem` copy the registry when they attach. Register themes and
recipes before mounting. To add one to a single mounted form later, register it on the registry
the attachment uses, `mounted.designSystem.registry`, then select it with
`mounted.updateDesignSystem({ theme: "station" })`.
