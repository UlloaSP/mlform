---
title: Transport
description: Envia valores mediante el transporte JSON por defecto o un transporte personalizado.
---

El kit puede crear un transporte JSON desde `endpoint`:

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
});
```

Personaliza la capa HTTP con `transportOptions`:

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

Para control total, pasa un `transport`:

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
