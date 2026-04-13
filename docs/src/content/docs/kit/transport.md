---
title: Transport
description: Submit MLForm values through a composed transport pipeline.
---

Use `createJsonTransport` for the simple JSON case:

```ts
import { createJsonTransport, mountForm } from "mlform";

mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema,
});
```

When you need HTTP customization, build the transport explicitly:

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

Use `createRoutingTransport` when MLForm should pick one transport internally. Route names are internal policy ids, not part of `form.submit()`:

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

Use `createFanoutTransport` when one submit should call every transport and merge the results:

```ts
import { createFanoutTransport, mountForm } from "mlform";

mountForm(container, {
  schema,
  transport: createFanoutTransport({
    transports: [localModelTransport, remoteApiTransport],
  }),
});
```

Use `createFallbackTransport` when later transports should run only after earlier failures:

```ts
import { createFallbackTransport, mountForm } from "mlform";

mountForm(container, {
  schema,
  transport: createFallbackTransport({
    transports: [primaryTransport, backupTransport],
  }),
});
```

Use middleware to compose auth, retries, circuit breaking, rate limiting, caching, deduplication, and request or response transforms:

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

Streaming is optional. Any transport may expose `stream(request)` alongside `submit(request)`. `createJsonTransport` can do that through `stream(response, request)`.
