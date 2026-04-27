---
title: Tracing Bridge
description: Propagate trace context through MLForm transports.
---

```ts
import { pipe, withTracing } from "mlform";

const transport = pipe(
  myTransport,
  withTracing({
    traceparent: () => currentTraceparent(),
    baggage: () => currentBaggage(),
    scope: "predict-form",
    requestId: () => crypto.randomUUID(),
  }),
);
```

`withTracing` writes trace data into request headers and mirrors policy metadata into transport context so shared backends can correlate requests.
