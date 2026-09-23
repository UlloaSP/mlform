---
title: Labels
description: User-facing labels available in the kit layer.
---

`KitLabels` customizes the copy used by the mounted shell, including explicit sections, tabs,
and wizard layouts.

```ts
import { predictionTransport } from "./prediction-transport";

mountForm(container, {
  transport: predictionTransport,
  schema,
  labels: {
    form: "Customer profile",
    reports: "Model output",
    submit: "Run prediction",
    validating: "Checking...",
    submitting: "Running...",
    prev: "Previous",
    next: "Next",
    step: "Step",
    stepLabel: (current, total) => `Step ${current} of ${total}`,
    tabs: "Form sections",
    sectionsOpen: (count) => `${count} sections open`,
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
| `prev`, `next` | Wizard and tabs navigation buttons. |
| `step`, `stepLabel` | Wizard progress text and accessible announcement. |
| `tabs` | Accessible name for the tab list. |
| `sectionsOpen` | Summary of open disclosure sections. |

For localization, pass translated labels at the same time as the schema. API names stay in English; only user-facing strings need translation.
