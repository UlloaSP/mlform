---
title: Transport
description: Envia valores mediante `endpoint` o mediante un pipeline de transportes compuesto.
---

Usa `endpoint` para el caso JSON simple:

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
});
```

Cuando necesites personalizar HTTP, crea el transporte de forma explícita:

```ts
import { createJsonTransport, mountForm } from "mlform";

mountForm(container, {
  schema,
  transport: createJsonTransport({
    endpoint: "/api/predict",
    method: "PATCH",
    headers: { "x-client": "mlform" },
    credentials: "include",
  }),
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

Usa `createRoutingTransport` cuando MLForm deba elegir internamente un solo transporte. Los nombres de ruta son ids internos de política, no parte de `form.submit()`:

```ts
import { createJsonTransport, createRoutingTransport, mountForm } from "mlform";

const transport = createRoutingTransport({
  transports: {
    local: {
      async submit(request) {
        return { reports: { prediction: await runLocalModel(request.serializedValues) } };
      },
    },
    remote: createJsonTransport({
      endpoint: "/api/predict",
    }),
  },
  selectTransport(request) {
    return request.serializedValues.mode === "offline" ? "local" : "remote";
  },
});

mountForm(container, {
  schema,
  transport,
});
```

Usa `createFanoutTransport` cuando un submit deba llamar a todos los transportes y combinar sus resultados:

```ts
import { createFanoutTransport, mountForm } from "mlform";

mountForm(container, {
  schema,
  transport: createFanoutTransport({
    transports: [localModelTransport, remoteApiTransport],
  }),
});
```

Usa `createFallbackTransport` cuando quieras probar transportes posteriores solo si fallan los anteriores:

```ts
import { createFallbackTransport, mountForm } from "mlform";

mountForm(container, {
  schema,
  transport: createFallbackTransport({
    transports: [primaryTransport, backupTransport],
  }),
});
```
