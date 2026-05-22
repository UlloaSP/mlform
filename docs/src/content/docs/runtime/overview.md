---
title: Runtime Overview
description: Use MLForm without the kit UI when you need headless state control.
---

The engine owns schema normalization, field state, validation, conditions, transport submission, reports, and subscriptions. Use it directly when you want your own renderer or a non-DOM integration.

```ts
import { createMlRegistryPack } from "mlform/builtins";
import { createForm } from "mlform/runtime";

const form = createForm({
  schema,
  registry: createMlRegistryPack().registry,
  transport: {
    async submit(request) {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries([["inputs", request.serializedValues]])),
      });

      return response.json();
    },
  },
});

form.setValues({ prompt: "Approve this application" });
const result = await form.submit();
```

Use the kit unless you need this level of control. The kit already wires the engine to primitives and the design system.
