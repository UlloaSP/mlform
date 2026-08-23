---
title: Transport
description: La frontera de submit entre MLForm y tu modelo o backend.
---

Transport recibe valores de MLForm y devuelve salida del modelo. Puede llamar HTTP, GraphQL, gRPC, un worker, un modelo en navegador o una funcion async propia.

Todo transport normal tiene un trabajo principal:

```ts
async submit(request) {
  return {
    reports: [{
      backend: "default",
      mappedTo: "prediction",
      status: "ready",
      payload: { label: "Approved", confidence: 0.92 },
    }],
  };
}
```

`request` contiene valores serializados y metadata. La respuesta alimenta reports. Al runtime no le importa que protocolo la produjo.

La aplicación controla protocolo y orquestación. MLForm controla los contratos de request y resultados de reports.
