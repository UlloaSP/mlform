---
title: Custom Transport
description: Submit through any async service instead of the default JSON endpoint.
---

MLForm intentionally exposes a transport contract instead of assuming one HTTP payload. Keep the
adapter in application code so its request and response mapping stay explicit.

```ts
import type { Transport } from "mlform/transport";

export const predictionTransport: Transport = {
  async submit(request) {
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request.modelValues),
      signal: request.signal,
    });

    if (!response.ok) {
      throw new Error(`Prediction request failed (${response.status}).`);
    }

    return response.json();
  },
};
```

Pass `predictionTransport` to `mountForm` or `createForm`. The response must match the report
contract expected by your schema; use a different adapter when the backend shape differs.
