---
title: Transport
description: Submit MLForm values through an application-owned transport.
---

Pass an object with one async `submit(request)` method. Protocol, authentication, retry, routing, and fanout remain application concerns.

```ts
import { mountForm } from "mlform/kit";

mountForm(container, {
  schema,
  transport: {
    async submit(request) {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request.modelValues),
      });
      const output = await response.json();
      return {
        reports: [
          {
            backend: "default",
            mappedTo: "prediction",
            status: "ready",
            payload: output.prediction,
          },
        ],
        meta: { requestId: output.requestId },
        raw: output,
      };
    },
  },
});
```

Every report result declares its exact `backend`, `mappedTo`, and `status`. Use `pending` with `context` for client-side report fetches, or `skipped` for non-applicable reports. See [Backend Contract](/guides/backend-contract/).

For independent backend calls, `createFanoutTransport` runs every target concurrently and gives `merge` ordered fulfilled/rejected outcomes. Set `failurePolicy: "fail-fast"` only when partial results are invalid for the application.
