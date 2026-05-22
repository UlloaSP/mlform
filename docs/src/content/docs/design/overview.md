---
title: Design System Overview
description: Themes, recipes, modes, and overrides for embedded MLForm UI.
---

The kit attaches MLForm's design system automatically. Configure it with `designSystem`.

```ts
mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema,
  designSystem: {
    mode: "auto",
    theme: "cobalt",
    recipe: "soft",
    overrides: {
      tokens: {
        "--mlf-control-height": "3rem",
      },
    },
  },
});
```

| Option      | Values                                                          |
| ----------- | --------------------------------------------------------------- |
| `mode`      | `light`, `dark`, `auto`, `inherit`                              |
| `theme`     | `neutral`, `cobalt`, `graphite`, `sage`, `sunset`, or custom id |
| `recipe`    | `default`, `minimal`, `soft`, `contrast`, or custom id          |
| `overrides` | Global tokens and component token overrides                     |
| `strict`    | Throw when theme/recipe ids or `--mlf-*` token keys are invalid |
| `onWarning` | Receive non-fatal resolver warnings during development          |

Use `mode: "inherit"` when the host app owns color-scheme state.

Prefer CSSOM-first token application when you already have a real element or shadow root:

```ts
import { resolveDesignSystem, writeDesignSystemTokenDeclarations } from "mlform/design";

const resolved = resolveDesignSystem({
  theme: "cobalt",
  recipe: "soft",
});

writeDesignSystemTokenDeclarations(host.style, resolved);
```

Keep `createDesignSystemStylesheet(resolved, selector)` for trusted CSS text generation.

Resolution precedence:

| Layer | Rule                                                                                     |
| ----- | ---------------------------------------------------------------------------------------- |
| 1     | Base global and component token defaults load first                                      |
| 2     | Theme `sharedTokens` apply before scheme-specific theme tokens                           |
| 3     | Recipe tokens and recipe component tokens override theme values                          |
| 4     | Runtime `overrides.tokens` and `overrides.components.*.tokens` win last                  |
| 5     | `light`/`dark` use explicit mode when available; `auto` uses system; `inherit` uses host |
| 6     | If dark tokens do not exist, resolution falls back to light and reports `theme-fallback` |

Diagnostics:

- Unknown theme or recipe ids fall back to built-in `neutral` and `default`.
- Unknown `--mlf-*` token keys stay allowed for compatibility, but surface through `resolved.warnings` and `onWarning`.
- Component buckets warn when a known token belongs to another component.
- Prefer `writeDesignSystemTokenDeclarations` when writing tokens to a `CSSStyleDeclaration`. Keep `createDesignSystemStylesheet` for trusted CSS text generation.

Registry lifecycle:

- `attachDesignSystem` and `mountForm` clone the provided registry at attach time.
- Later mutations to original registry do not affect mounted instances.
- To mutate one mounted instance, update `attached.registry` or the mounted design registry, then trigger a refresh with `updateDesignSystem({})` or another config update.
