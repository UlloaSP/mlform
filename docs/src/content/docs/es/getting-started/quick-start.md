---
title: Quick Start
description: Monta una instancia funcional de MLForm con la API publica actual.
---

Crea un elemento host:

```html
<div id="prediction-form"></div>
```

Monta MLForm:

```ts
import { mountForm } from "mlform/kit";
import { createJsonTransport } from "mlform/transport";

const container = document.querySelector("#prediction-form");

if (!container) {
  throw new Error("Missing #prediction-form container.");
}

const mounted = mountForm(container as HTMLElement, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema: {
    fields: [
      {
        id: "prompt",
        kind: "text",
        label: "Prompt",
        required: true,
        minLength: 3,
      },
      {
        id: "threshold",
        kind: "number",
        label: "Confidence threshold",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.75,
      },
    ],
    reports: [
      {
        id: "prediction",
        kind: "classifier",
        label: "Prediction",
      },
    ],
  },
  labels: {
    submit: "Run prediction",
    submitting: "Running...",
  },
  layout: "split",
  designSystem: {
    mode: "auto",
    theme: "cobalt",
    recipe: "soft",
  },
});

window.addEventListener("beforeunload", () => mounted.unmount());
```

El transporte JSON por defecto envia los valores serializados bajo la clave `inputs`:

```json
{
  "inputs": {
    "prompt": "Example text",
    "threshold": 0.75
  }
}
```

Devuelve informes indexados por el id del informe:

```json
{
  "reports": {
    "prediction": {
      "label": "Approved",
      "confidence": 0.91,
      "probabilities": {
        "Approved": 0.91,
        "Rejected": 0.09
      }
    }
  },
  "meta": {
    "model": "credit-risk-v2"
  }
}
```
