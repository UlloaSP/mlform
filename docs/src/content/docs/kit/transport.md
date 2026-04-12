---
title: Transport
description: Submit MLForm values through endpoint sugar or a composed transport pipeline.
---

Use `endpoint` for the simple JSON case:

```ts
mountForm(container, {
  endpoint: "/api/predict",
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
