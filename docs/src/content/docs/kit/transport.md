---
title: Transport
description: Submit MLForm values through the default JSON transport or a custom transport.
---

The kit can create a JSON transport from `endpoint`:

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
});
```

Customize the HTTP layer with `transportOptions`:

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
  transportOptions: {
    method: "PATCH",
    headers: { "x-client": "mlform" },
    credentials: "include",
  },
});
```

For full control, provide a `transport`:

```ts
mountForm(container, {
  schema,
  transport: {
    async submit(request) {
      return {
        reports: {
          prediction: await runLocalModel(request.serializedValues),
        },
      };
    },
  },
});
```
