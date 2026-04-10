---
title: Transporte de modelo local
description: Ejecuta un modelo sin llamada de red.
---

```ts
const transport = {
  async submit(request) {
    const score = await localModel.predict(request.values);

    return {
      reports: {
        prediction: {
          label: score > 0.7 ? "Approved" : "Review",
          confidence: score,
        },
      },
    };
  },
};

mountForm(container, { schema, transport });
```

Respeta `request.signal` si el modelo tarda y puede cancelarse.
