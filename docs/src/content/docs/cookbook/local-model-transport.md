---
title: Local Model Transport
description: Run a model in the browser or host app without a network request.
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
      meta: { runtime: "local" },
    };
  },
};

mountForm(container, { schema, transport });
```

Keep local transports deterministic in tests. If prediction is slow, respect `request.signal` and stop work when it is aborted.
