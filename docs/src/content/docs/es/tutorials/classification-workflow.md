---
title: Flujo de clasificación
description: Renderiza etiquetas, confianza y probabilidades.
---

Usa un informe `classifier` cuando el modelo elige una etiqueta o clase.

```ts
reports: [{ id: "decision", kind: "classifier", label: "Decision", mappedTo: "decision" }];
```

Respuesta recomendada:

```json
{
  "reports": [
    {
      "backend": "default",
      "mappedTo": "decision",
      "status": "ready",
      "payload": {
        "prediction": "Approved",
        "probabilities": [0.91, 0.09]
      }
    }
  ]
}
```

Mantén el orden de `probabilities` alineado con las etiquetas visibles del modelo.
