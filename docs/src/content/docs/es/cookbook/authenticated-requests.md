---
title: Requests autenticadas
description: Cookies, bearer tokens y headers personalizados.
---

```ts
mountForm(container, {
  schema,
  endpoint: "/api/predict",
  transportOptions: {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Request-Source": "mlform",
    },
  },
});
```

Para cookies, configura CORS en backend. Para tokens efímeros, remonta cuando cambie el token.
