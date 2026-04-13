---
title: Transport
description: Envia valores mediante un pipeline de transportes compuesto.
---

Usa `createJsonTransport` para el caso JSON simple:

```ts
import { createJsonTransport, mountForm } from "mlform";

mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
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

Usa middleware para componer auth, retries, circuit breaker, rate limit, cache, dedup y transforms de request o response:

```ts
import {
  createJsonTransport,
  mountForm,
  pipe,
  withAuth,
  withCircuitBreaker,
  withRateLimit,
  withRetry,
} from "mlform";

const transport = pipe(
  createJsonTransport({ endpoint: "/api/predict" }),
  withAuth({ type: "bearer", token: () => getAccessToken() }),
  withRetry({ attempts: 3 }),
  withCircuitBreaker({ failureThreshold: 5, resetTimeout: 60_000 }),
  withRateLimit({ maxConcurrent: 4, perSecond: 8 }),
);

mountForm(container, {
  schema,
  transport,
});
```

Streaming es opcional. Cualquier transport puede exponer `stream(request)` ademas de `submit(request)`. `createJsonTransport` puede hacerlo mediante `stream(response, request)`.
