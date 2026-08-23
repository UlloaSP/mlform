---
title: Contrato backend
description: Request, response, meta y parse personalizado.
---

El transporte recibe valores de modelo keyed por `mappedTo` resuelto:

```json
{
  "modelValues": {
    "feature_key": "Example text"
  }
}
```

La respuesta recomendada es:

```json
{
  "reports": [
    {
      "backend": "default",
      "mappedTo": "report_key",
      "status": "ready",
      "payload": { "prediction": "Approved", "probabilities": [0.91, 0.09] }
    }
  ],
  "meta": {
    "model": "demo"
  }
}
```

Usa `request.displayValues` para review/export keyed por `displayKey`; campos sin `displayKey` se omiten. Usa `request.modelValues` para backend/modelo keyed por `mappedTo`. El field `id` sigue siendo handle runtime para estado UI.

Usa `createSubmissionSnapshot(form, options)` cuando una app necesita los mismos records para review, persistencia o export antes del submit.

Usa `createMultiBackendSubmissionSnapshot(form, { backends })` cuando un form visible alimenta varios modelos con claves `mappedTo` distintas. Usa `executeMultiBackendPipeline({ form, backends })` cuando una acción de usuario debe enviar cada backend y conservar resultados, report fetch outputs, errores, reports omitidos y contextos por backend.

`ready` exige `payload`. `pending` puede aportar contexto específico al fetch del report. `skipped` representa un report no aplicable y es terminal. Cada resultado se identifica por su par exacto `(backend, mappedTo)`; las formas legacy o malformadas fallan el submit.
