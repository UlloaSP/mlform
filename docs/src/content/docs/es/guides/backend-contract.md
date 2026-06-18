---
title: Contrato backend
description: Request, response, meta y parse personalizado.
---

El transporte JSON por defecto envía valores de modelo keyed por `mappedTo` resuelto:

```json
{
  "inputs": {
    "feature_key": "Example text"
  }
}
```

La respuesta recomendada es:

```json
{
  "reports": {
    "report_key": {
      "label": "Approved",
      "confidence": 0.91
    }
  },
  "meta": {
    "model": "demo"
  }
}
```

Usa `request.displayValues` para review/export keyed por `displayKey`; campos sin `displayKey` se omiten. Usa `request.serializedValues` o `request.modelValues` para backend/modelo keyed por `mappedTo`. El field `id` sigue siendo handle runtime para estado UI.

Usa `createSubmissionSnapshot(form, options)` cuando una app necesita los mismos records para review, persistencia o export antes del submit.

Usa `createMultiBackendSubmissionSnapshot(form, { backends })` cuando un form visible alimenta varios modelos con claves `mappedTo` distintas. Usa `executeMultiBackendPipeline({ form, backends })` cuando una acción de usuario debe enviar cada backend y conservar resultados, report fetch outputs, errores, reports omitidos y contextos por backend. `createFanoutTransport` sigue siendo fanout de transporte; no resuelve mappings de schema por backend.

Usa `createJsonTransport({ body })` si tu backend necesita otra forma de request y `createJsonTransport({ parse })` si no responde JSON estándar.

```ts
const transport = createJsonTransport({
  endpoint: "/api/predict",
  body: (request) => JSON.stringify({ inputs: request.modelValues }),
  parse: async (response) => response.json(),
});
```

El fallback de salidas legacy existe solo por compatibilidad. La documentación nueva debe usar `reports`.
