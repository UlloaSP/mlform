---
title: Requests autenticadas
description: Cookies, bearer tokens y headers personalizados.
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

Para cookies, configura CORS en backend. Para tokens efímeros, remonta cuando cambie el token.
