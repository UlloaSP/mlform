---
title: Multi-step Forms
description: Build staged workflows with conditions and external state.
---

MLForm no longer requires host-owned step state for the common wizard case. Prefer:

- `mountForm()` for built-in wizard UI
- `createFormView()` for custom step-based UI

Use host state plus field conditions only when the flow is more specialized than the standard wizard contract.

```ts
let step = "profile";

const schema = {
  fields: [
    { id: "name", kind: "text", label: "Name" },
    {
      id: "risk_details",
      kind: "text",
      label: "Risk details",
      hiddenWhen: () => step !== "risk",
    },
  ],
  reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
};
```

Function conditions are TypeScript-only and not JSON-serializable. For schemas served from a backend, encode steps as a normal `category` field and use declarative conditions.
