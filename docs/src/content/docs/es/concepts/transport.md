---
title: Transport
description: La frontera de submit entre MLForm y tu modelo o backend.
---

Transport recibe valores de MLForm y devuelve salida del modelo. Puede llamar HTTP, GraphQL, gRPC, un worker, un modelo en navegador o una funcion async propia.

Todo transport normal tiene un trabajo principal:

```ts
async submit(request) {
  return { reports: { prediction: { label: "Approved", confidence: 0.92 } } };
}
```

`request` contiene valores serializados y metadata. La respuesta alimenta reports. Al runtime no le importa que protocolo la produjo.

Opciones de transport añaden politica alrededor del contrato:

| Concepto | Significado |
| --- | --- |
| capability | Que puede hacer un transport: submit, stream, retry, cache, auth, limites. |
| middleware | Auth, timeout, retry, cache, tracing, metrics, rate limit, circuit breaker. |
| orchestration | Routing, fallback, fanout, quorum, hedging, load balancing. |
| policy backend | Cache, limiter, breaker o health state compartidos fuera de una instancia. |

Usa `createJsonTransport()` para un endpoint backend normal. Usa transports custom cuando el submit ya pertenece a otro servicio de app o a un modelo local.
