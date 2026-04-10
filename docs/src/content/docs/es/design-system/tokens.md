---
title: Tokens
description: Sobrescribe CSS custom properties y tokens de componentes de MLForm.
---

Usa overrides del sistema de diseño para configuracion runtime:

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

Usa CSS del host cuando la aplicacion externa controla los tokens visuales:

```css
#prediction-form mlf-form {
  --mlf-color-accent: var(--brand-action);
  --mlf-color-text: var(--app-text);
}
```
