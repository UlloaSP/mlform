---
title: View
description: Use createFormView to build custom layouts without dropping to the engine directly.
---

`mlform/view` sits between the headless runtime and the mounted kit. It owns layout resolution,
navigation, visibility, descriptors, and declarative field and report extensions without creating DOM.

Use it when you want:

- custom React, Vue, Lit, or vanilla DOM layouts
- step-based flows with app-owned layout control
- access to resolved fields, reports, registries, and wizard navigation from one app-facing API

```ts
import { createFormView } from "mlform/view";
import { predictionTransport } from "./prediction-transport";

const view = createFormView({
  transport: predictionTransport,
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
- `wizard` — current wizard metadata or `null`

Unlike `mountForm()`, `createFormView()` does not create DOM or attach a design system stylesheet.

Use `subscribe()` to re-render your host UI and `navigation.next()`, `navigation.previous()`, or `navigation.activate(stepId)` to drive wizard flows.

Read next:

- [Layout Overview](./layout-overview/)
- [Layout Schema](./layout-schema/)
- [createFormView](./create-form-view/)
- [Custom Layouts](./custom-layouts/)
