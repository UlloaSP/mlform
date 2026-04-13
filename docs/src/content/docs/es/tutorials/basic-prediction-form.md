---
title: Formulario básico de predicción
description: Tutorial completo con campos text, number, category y un informe classifier.
---

## Objetivo

Montar un formulario que recoja una descripción, un umbral y un segmento, y muestre una predicción.

```ts
import { createJsonTransport, mountForm } from "mlform";

const container = document.querySelector("#prediction-form");
if (!container) throw new Error("Missing #prediction-form container.");

const mounted = mountForm(container as HTMLElement, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema: {
    fields: [
      { id: "prompt", kind: "text", label: "Prompt", required: true, minLength: 3 },
      { id: "threshold", kind: "number", label: "Threshold", min: 0, max: 1, step: 0.05 },
      {
        id: "segment",
        kind: "category",
        label: "Segment",
        options: ["Consumer", "Business", "Enterprise"],
      },
    ],
    reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
  },
});
```

Payload esperado:

```json
{
  "inputs": {
    "prompt": "Customer wants annual billing",
    "threshold": 0.75,
    "segment": "Business"
  }
}
```

Evita ids generados en formularios reales; el backend debe depender de ids estables.
