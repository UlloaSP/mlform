---
title: Contrato backend
description: Request, response, meta y parse personalizado.
---

El transporte JSON por defecto envía:

```json
{
  "inputs": {
    "prompt": "Example text"
  }
}
```

La respuesta recomendada es:

```json
{
  "reports": {
    "prediction": {
      "label": "Approved",
      "confidence": 0.91
    }
  },
  "meta": {
    "model": "demo"
  }
}
```

Usa `transportOptions.body` si tu backend necesita otra forma de request y `transportOptions.parse` si no responde JSON estándar.

```ts
transportOptions: {
  body: (request) => JSON.stringify({ "inputs": request.serializedValues }),
  parse: async (response) => response.json()
}
```

El fallback de salidas legacy existe solo por compatibilidad. La documentación nueva debe usar `reports`.
