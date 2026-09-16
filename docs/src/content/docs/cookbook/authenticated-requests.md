---
title: Authenticated Requests
description: Send cookies, bearer tokens, or custom headers with MLForm submissions.
---

```ts
import { mountForm } from "mlform/kit";

const transport = {
  async submit(request) {
    const response = await fetch("/api/predict", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Request-Source": "mlform",
      },
      body: JSON.stringify(request.modelValues),
      signal: request.signal,
    });

    if (!response.ok) throw new Error(`Prediction request failed (${response.status}).`);
    return response.json();
  },
};

mountForm(container, {
  schema,
  transport,
});
```

For short-lived tokens, create the transport when the token changes and remount intentionally. For cookies, use `credentials: "include"` and configure CORS on the backend.
