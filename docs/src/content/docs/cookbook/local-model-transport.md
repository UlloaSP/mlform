---
title: Local Model Transport
description: Run a model in the browser or host app without a network request.
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
      meta: { runtime: "local" },
    };
  },
};

mountForm(container, { schema, transport });
```

Keep local transports deterministic in tests. If prediction is slow, respect `request.signal` and stop work when it is aborted.
