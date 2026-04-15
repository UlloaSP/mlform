---
title: Transport Capabilities
description: Normalize transport behavior so middleware and orchestration can enforce policy safely.
---

Every transport should expose normalized capabilities:

```ts
const capabilities = {
  modes: { submit: true, stream: false, session: false },
  safety: { idempotent: false, retrySafe: false, cacheable: false, hedgeSafe: false },
  limits: { maxPayloadBytes: 512_000, maxBufferedMessages: 100 },
  auth: { kinds: ["bearer", "transport-context"] },
  delivery: { mode: "request-response", consistency: "best-effort", backpressure: "none" },
};
```

Use `assertTransportCapabilities(transport, requirement, context)` when you need hard policy enforcement.

Examples:

- `withRetry` requires `safety.retrySafe === true` unless explicitly overridden.
- `withCache` requires `safety.cacheable === true` unless explicitly overridden.
- `createHedgedTransport` requires `safety.hedgeSafe === true` unless explicitly overridden.
- payload-aware adapters compare `SubmitRequest.metadata.estimatedPayloadBytes` against `limits.maxPayloadBytes`.
