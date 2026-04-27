---
title: Authenticated Requests
description: Send cookies, bearer tokens, or custom headers with MLForm submissions.
---

```ts
import { createJsonTransport, mountForm } from "mlform";

mountForm(container, {
  schema,
  transport: createJsonTransport({
    endpoint: "/api/predict",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Request-Source": "mlform",
    },
  }),
});
```

For short-lived tokens, create the transport when the token changes and remount intentionally. For cookies, use `credentials: "include"` and configure CORS on the backend.
