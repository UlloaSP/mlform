---
title: From Legacy MLForm
description: Map the old MLForm class examples to the current mountForm API.
---

Older examples used a class-shaped API:

```ts
const mlForm = new MLForm("/api/predict");
await mlForm.toHTMLElement(schema, container);
```

Use `mountForm` instead:

```ts
import { createJsonTransport, mountForm } from "mlform";

const mounted = mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema,
});
```

Migration map:

| Legacy                         | Current                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `new MLForm(url)`              | `mountForm(container, { transport: createJsonTransport({ endpoint: url }), schema })` |
| `toHTMLElement(...)`           | `mountForm(...)`                                                                      |
| `inputs` collection            | `fields` collection                                                                   |
| `outputs` collection           | `reports` collection                                                                  |
| field `type`                   | field `kind`                                                                          |
| field `title`                  | field `label`                                                                         |
| `onSubmit` callback            | `hooks.afterSubmit`, `hooks.beforeSubmit`, or `mounted.form.submit()`                 |
| `mlform/extensions` strategies | engine definitions and primitive registries                                           |

Legacy schema:

```ts
const oldSchema = {
  inputs: [{ type: "text", title: "Prompt" }],
  outputs: [{ type: "classifier", title: "Prediction" }],
};
```

Current schema:

```ts
const schema = {
  fields: [{ kind: "text", label: "Prompt" }],
  reports: [{ kind: "classifier", label: "Prediction" }],
};
```

Transport-breaking changes since the early transport helpers:

- `transport.capabilities` is now normalized:
  - `modes`
  - `safety`
  - `limits`
  - `auth`
  - `delivery`
- `withMetrics` now takes `{ emit(event) }` instead of separate callbacks.
- shared policy stores are scoped:
  - `TransportCacheStore.get(scope, key)`
  - `SharedRateLimiter.acquire(scope, lease)`
  - `CircuitBreakerSharedState.get(scope)`
  - `TransportHealthState.getSnapshot(scope, transportId)`
- `SubmitRequest.metadata.estimatedPayloadBytes` is populated when MLForm can estimate payload size.
- session transports should expose `session.capabilities.backpressure` and may expose `bufferedMessages`.

Minimal capability migration example:

```ts
const transport = {
  async submit(request) {
    return callBackend(request.serializedValues);
  },
  capabilities: {
    modes: { submit: true, stream: false, session: false },
    safety: { idempotent: false, retrySafe: false, cacheable: false, hedgeSafe: false },
    limits: {},
    auth: { kinds: ["none"] },
    delivery: { mode: "request-response", consistency: "unknown", backpressure: "none" },
  },
};
```
