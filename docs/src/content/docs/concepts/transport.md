---
title: Transport
description: The submit boundary between MLForm and model or backend code.
---

Transport is the part that receives MLForm values and returns model output. It can call HTTP, GraphQL, gRPC, a worker, a browser model, or your own async function.

Every normal transport has one main job:

```ts
async submit(request) {
  return { reports: { prediction: { label: "Approved", confidence: 0.92 } } };
}
```

`request` contains serialized field values plus metadata. The response feeds reports. The runtime does not care which protocol produced it.

Transport options add policy around that contract:

| Concept | Meaning |
| --- | --- |
| capability | What a transport can safely do: submit, stream, retry, cache, auth, limits. |
| middleware | Auth, timeout, retry, cache, tracing, metrics, rate limit, circuit breaker. |
| orchestration | Routing, fallback, fanout, quorum, hedging, load balancing. |
| policy backend | Shared cache, limiter, breaker, or health state outside one form instance. |

Use `createJsonTransport()` for the usual backend endpoint. Reach for custom transports when submission already belongs to another app service or local model.
