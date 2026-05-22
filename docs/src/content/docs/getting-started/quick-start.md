---
title: Quick Start
description: Mount a working MLForm instance with the current public API.
---

This is the canonical minimal setup for MLForm.

Create a host element:

```html
<div id="prediction-form"></div>
```

Mount MLForm:

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

The default JSON transport sends serialized values under the `inputs` key:

```json
{
  "inputs": {
    "prompt": "Example text",
    "threshold": 0.75
  }
}
```

Next, build the endpoint in [First Backend](./first-backend/).

Return reports keyed by report id:

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
