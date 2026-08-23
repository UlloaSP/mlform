---
title: Flujo de regresión
description: Predicciones numéricas con unidades, precisión e intervalo.
---

Usa `regressor` para valores numéricos.

```ts
reports: [{ id: "forecast", kind: "regressor", label: "Forecast", mappedTo: "forecast" }];
```

Respuesta recomendada:

```json
{
  "reports": [
    {
      "backend": "default",
      "mappedTo": "forecast",
      "status": "ready",
      "payload": {
        "value": 128400,
        "interval": [112000, 142500]
      }
    }
  ]
}
```

El backend debe devolver números reales, no strings formateados, para que el renderer pueda aplicar precisión y unidad.
