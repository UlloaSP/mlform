---
title: MLForm
description: Schema-driven machine learning forms for web applications.
---

MLForm mounts validated, schema-driven forms that submit structured values to a machine learning backend and render model reports in the same host element.

Use it when a product needs a predictable input layer for models: prediction forms, scoring dashboards, review tools, forecasting panels, internal ML consoles, or any workflow where UI state and backend payloads must stay aligned.

```ts
import { createJsonTransport, mountForm } from "mlform";

mountForm(document.querySelector("#prediction-form") as HTMLElement, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema: {
    fields: [{ id: "prompt", kind: "text", label: "Prompt", required: true }],
    reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
  },
});
```

<div class="card-grid">
  <div class="doc-card"><strong>Kit</strong>Mount built-in one-page, wizard, or tabs forms, or drive custom layouts through the headless view API.</div>
  <div class="doc-card"><strong>Engine</strong>Validate fields, track state, run hooks, and submit through any transport.</div>
  <div class="doc-card"><strong>Primitives</strong>Render built-in Web Components for fields, submit actions, and reports.</div>
  <div class="doc-card"><strong>Design system</strong>Apply themes, recipes, density, motion, and host app token overrides.</div>
</div>

Choose your path:

| Goal                            | Start here                                          |
| ------------------------------- | --------------------------------------------------- |
| I want a working form           | [Quick Start](./getting-started/quick-start/)       |
| I need backend integration      | [First Backend](./getting-started/first-backend/)   |
| I need custom fields or reports | [Custom Fields](./engine/custom-fields/)            |
| I need theming                  | [Design System Overview](./design-system/overview/) |

If you are new to MLForm, read [Mental Model](./getting-started/mental-model/) before the reference pages.
