---
title: Flujo de clasificación
description: Renderiza etiquetas, confianza, probabilidades y detalles.
---

Usa un informe `classifier` cuando el modelo elige una etiqueta o clase.

```ts
reports: [{ id: "decision", kind: "classifier", label: "Decision" }];
```

Respuesta recomendada:

```json
{
  "reports": {
    "decision": {
      "label": "Approved",
      "confidence": 0.91,
      "probabilities": {
        "Approved": 0.91,
        "Rejected": 0.09
      },
      "details": {
        "threshold": 0.75
      }
    }
  }
}
```

Mantén las claves de `probabilities` alineadas con las etiquetas visibles del modelo.
