---
title: Transport Personalizado
description: Envia mediante cualquier servicio asincrono en vez del endpoint JSON por defecto.
---

Pasa `transport` cuando el contrato del backend no coincide con el transporte JSON por defecto.

```ts
mountForm(container, {
  schema,
  transport: {
    async submit(request) {
      const result = await modelClient.predict({
        values: request.serializedValues,
        signal: request.signal,
      });

      return {
        reports: {
          prediction: result.prediction,
        },
        meta: {
          requestId: result.requestId,
        },
      };
    },
  },
});
```

No proporciones `transport` y `endpoint` a la vez; MLForm lo trata como error de configuracion.
