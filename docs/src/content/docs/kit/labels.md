---
title: Labels
description: User-facing labels available in the kit layer.
---

`KitLabels` customizes the copy used by the mounted primitive shell.

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
  labels: {
    form: "Customer profile",
    reports: "Model output",
    submit: "Run prediction",
    validating: "Checking...",
    submitting: "Running...",
  },
});
```

| Label        | Default role                             |
| ------------ | ---------------------------------------- |
| `form`       | Accessible label for the form area.      |
| `reports`    | Accessible label for the report area.    |
| `submit`     | Submit button text.                      |
| `validating` | Temporary label while validation runs.   |
| `submitting` | Temporary label while submit is pending. |

For localization, pass translated labels at the same time as the schema. API names stay in English; only user-facing strings need translation.
