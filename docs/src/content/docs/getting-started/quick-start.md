---
title: Quick Start
description: Mount a working MLForm instance with the current public API.
---

Create a host element:

```html
<div id="prediction-form"></div>
```

Mount MLForm with a schema and a transport:

```ts
import { mountForm } from "mlform";
import type { Transport } from "mlform/transport";

const transport: Transport = {
  async submit(request) {
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        inputs: request.modelValues,
        reports: request.reports,
      }),
      signal: request.signal,
    });

    if (!response.ok) throw new Error(`Prediction failed: ${response.status}`);
    return response.json();
  },
};

const container = document.querySelector<HTMLElement>("#prediction-form");
if (!container) throw new Error("Missing #prediction-form container.");

const mounted = mountForm(container, {
  transport,
  schema: {
    fields: [
      { id: "prompt", kind: "text", label: "Prompt", required: true, mappedTo: "prompt" },
      {
        id: "threshold",
        kind: "number",
        label: "Confidence threshold",
        min: 0,
        max: 1,
        defaultValue: 0.75,
        mappedTo: "threshold",
      },
    ],
    reports: [
      {
        id: "prediction",
        kind: "classifier",
        label: "Prediction",
        mappedTo: "prediction",
      },
    ],
  },
  labels: { submit: "Run prediction" },
  designSystem: { mode: "auto", theme: "cobalt", recipe: "soft" },
});

window.addEventListener("beforeunload", () => mounted.unmount());
```

The example transport sends `request.modelValues` under `inputs`. Build the endpoint in [First Backend](./first-backend/).

Return explicit report envelopes:

```json
{
  "reports": [
    {
      "backend": "default",
      "mappedTo": "prediction",
      "status": "ready",
      "payload": {
        "prediction": "Approved",
        "labels": ["Approved", "Rejected"],
        "probabilities": [0.91, 0.09]
      }
    }
  ],
  "meta": { "model": "credit-risk-v2" }
}
```
