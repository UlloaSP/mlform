---
title: Shared Circuit Breaker State
description: Share circuit status across MLForm workers.
---

```ts
import { pipe, withCircuitBreaker } from "mlform/transport";

const sharedState = {
  async get(scope) {
    return readBreakerState(scope);
  },
  async set(scope, snapshot) {
    await writeBreakerState(scope, snapshot);
  },
};

const transport = pipe(
  myTransport,
  withCircuitBreaker({
    scope: "predict-backend",
    failureThreshold: 5,
    resetTimeout: 60_000,
    sharedState,
  }),
);
```
