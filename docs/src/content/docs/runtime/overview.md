---
title: Runtime Overview
description: Use MLForm without the kit UI when you need headless state control.
---

The runtime normalizes schemas through the schema layer and owns field state, validation,
conditions, submission, report state, and subscriptions. Use it directly when you want your own
renderer or a non-DOM integration.

```ts
import { createBuiltinMlRegistry } from "mlform/builtins";
import { createForm } from "mlform/runtime";

const form = createForm({
  schema,
  registry: createBuiltinMlRegistry(),
  transport: {
    async submit(request) {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: request.modelValues }),
        signal: request.signal,
      });

      if (!response.ok) throw new Error(`Prediction failed: ${response.status}`);
      return response.json();
    },
  },
});

form.setValues({ prompt: "Approve this application" });
const result = await form.submit();
```

Use the kit unless you need this level of control. The kit connects the runtime to primitives
and the design system through the view layer.
