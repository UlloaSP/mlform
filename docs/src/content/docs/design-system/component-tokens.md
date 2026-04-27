---
title: Component Tokens
description: Per-component token defaults and override patterns.
---

MLForm exposes component-level token defaults through `componentKeys` and `componentTokenDefaults`.

```ts
import { componentKeys, componentTokenDefaults } from "mlform/design-system";
```

Use component tokens when one part of the UI needs a different surface, border, radius, or shadow without changing the whole theme.

```ts
designSystem: {
  overrides: {
    components: {
      submit: {
        tokens: {
          "--mlf-submit-radius": "6px",
          "--mlf-submit-shadow": "none"
        }
      },
      report: {
        tokens: {
          "--mlf-report-border": "1px solid var(--mlf-color-border)"
        }
      }
    }
  }
}
```

Prefer global tokens for brand color and spacing. Prefer component tokens for one component family.
