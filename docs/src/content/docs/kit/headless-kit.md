---
title: Headless Kit
description: Use createFormView to build custom layouts without dropping to the engine directly.
---

`createFormView()` sits between `mountForm()` and `mlform/runtime`.

Use it when you want:

- custom React, Vue, Lit, or vanilla DOM layouts
- step-based flows with app-owned layout control
- access to resolved fields, reports, explanations, registries, and wizard navigation from one app-facing API

```ts
import { createFormView, createJsonTransport } from "mlform";

const view = createFormView({
  transport: createJsonTransport({ endpoint: "/predict" }),
  schema,
  layout: {
    kind: "wizard",
    steps: [
      {
        title: "Profile",
        children: [{ kind: "field", field: "name" }],
      },
      {
        title: "Review",
        children: [{ kind: "field", field: "email" }],
      },
    ],
  },
});

const snapshot = view.getSnapshot();
```

`FormViewSnapshot` gives you:

- `form` — the current `FormState`
- `layout` — normalized, validated layout tree
- `fields`
- `reports`
- `explanations`
- `wizard` — current wizard metadata or `null`

Unlike `mountForm()`, `createFormView()` does not create DOM or attach a design system stylesheet.

Use `subscribe()` to re-render your host UI and `nextStep()`, `prevStep()`, or `goToStep()` to drive wizard flows.

Read next:

- [Layout Overview](./layout-overview/)
- [Layout Schema](./layout-schema/)
- [createFormView](./create-form-view/)
- [Custom Layouts](./custom-layouts/)
