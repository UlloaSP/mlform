---
title: Transport Architecture
description: How MLForm keeps backend I/O explicit and protocol-agnostic.
---

A transport has one required operation: `submit(request)`. The request contains backend-facing
`modelValues`, UI-facing `displayValues`, ordered mapped inputs, normalized field and report
configuration, the optional backend name, and an `AbortSignal`.

The request, its records, and their plain object and array containers are frozen snapshots. Opaque
values such as dates, maps, sets, binary views, and blobs are isolated clones but
retain their platform mutation APIs. An adapter may transform the request into its own protocol
payload, but it must not mutate the MLForm request. Transport failures are exposed as the `cause`
of `SubmitError`; response `reports` must be an array and `meta` must be an object.

```ts
import type { Transport } from "mlform/transport";

const transport: Transport = {
  async submit(request) {
    return modelClient.predict(request.modelValues, { signal: request.signal });
  },
};
```

MLForm does not infer HTTP, streaming, retry, authentication, or caching policy. Put those
decisions in the application adapter or client library that owns the backend protocol. Preserve
`request.signal`, throw on failures, and return the report payload shape declared by the schema.

Use `createFanoutTransport` only when one submission must be sent to several named transports. Its
default policy collects ordinary target failures. External cancellation always rejects the whole
fanout; `fail-fast` additionally aborts the sibling target signals after the first failure.
Runtime pipelines compose completed submissions and report fetches; they are not middleware.
