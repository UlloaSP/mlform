---
title: Transport
description: Envía valores de MLForm mediante un transporte de la aplicación.
---

Pasa un objeto con un método async `submit(request)`. Protocolo, autenticación, reintentos, routing y fanout pertenecen a la aplicación.

```ts
import { mountForm } from "mlform/kit";

mountForm(container, {
  schema,
  transport: {
    async submit(request) {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request.modelValues),
      });
      const output = await response.json();
      return {
        reports: [
          {
            backend: "default",
            mappedTo: "prediction",
            status: "ready",
            payload: output.prediction,
          },
        ],
        meta: { requestId: output.requestId },
        raw: output,
      };
    },
  },
});
```

Cada resultado declara `backend`, `mappedTo` y `status`. Usa `pending` con `context` para fetches de report en cliente, o `skipped` cuando no sea aplicable.

Para backends independientes, `createFanoutTransport` ejecuta cada target en paralelo y entrega a `merge` outcomes ordenados fulfilled/rejected. Usa `failurePolicy: "fail-fast"` solo si la aplicacion no admite resultados parciales.
