---
title: Flujo de regresión
description: Predicciones numéricas con unidades, precisión e intervalo.
---

Usa `regressor` para valores numéricos.

```ts
reports: [{ id: "forecast", kind: "regressor", label: "Forecast" }];
```

Respuesta recomendada:

```json
{
  "reports": {
    "forecast": {
      "value": 128400,
      "unit": "USD",
      "precision": 0,
      "confidenceInterval": [112000, 142500]
    }
  }
}
```

El backend debe devolver números reales, no strings formateados, para que el renderer pueda aplicar precisión y unidad.
