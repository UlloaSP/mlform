---
title: Metrics Bridge
description: Emit structured transport telemetry into your metrics pipeline.
---

```ts
import { pipe, withMetrics } from "mlform/transport";

const transport = pipe(
  myTransport,
  withMetrics({
    emit(event) {
      metricsClient.count(`transport.${event.kind}`, 1, {
        scope: event.scope ?? "unknown",
        source: event.source ?? "unknown",
      });
    },
  }),
);
```

`emit(event)` receives:

- request start
- request success
- request error
- stream events
- session open
- session close
- capability rejects
- policy blocks
