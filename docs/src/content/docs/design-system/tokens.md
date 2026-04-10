---
title: Tokens
description: Override MLForm CSS custom properties and component tokens.
---

Use design system overrides for runtime configuration:

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
  designSystem: {
    overrides: {
      tokens: {
        "--mlf-color-accent": "#0d7f70",
        "--mlf-radius-md": "8px",
      },
      components: {
        submit: {
          tokens: {
            "--mlf-submit-radius": "8px",
          },
        },
      },
    },
  },
});
```

Use host CSS when the surrounding application owns visual tokens:

```css
#prediction-form mlf-form {
  --mlf-color-accent: var(--brand-action);
  --mlf-color-text: var(--app-text);
}
```
