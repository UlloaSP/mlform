---
title: Multi-step Forms
description: Build staged workflows with conditions and external state.
---

MLForm does not force a wizard component. Use host state for the current step and field conditions for step visibility.

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
