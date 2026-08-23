---
title: Transporte de modelo local
description: Ejecuta un modelo sin llamada de red.
---

```ts
const transport = {
  async submit(request) {
    const score = await localModel.predict(request.modelValues);

    return {
      reports: [
        {
          backend: request.backend ?? "default",
          mappedTo: "prediction",
          status: "ready",
          payload: {
            prediction: score > 0.7 ? "Approved" : "Review",
            probabilities: [score, 1 - score],
          },
        },
      ],
    };
  },
};

mountForm(container, { schema, transport });
```

Respeta `request.signal` si el modelo tarda y puede cancelarse.
