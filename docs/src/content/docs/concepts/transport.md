---
title: Transport
description: The submit boundary between MLForm and model or backend code.
---

Transport is the part that receives MLForm values and returns model output. It can call HTTP, GraphQL, gRPC, a worker, a browser model, or your own async function.

Every normal transport has one main job:

```ts
async submit(request) {
  return {
    reports: [{
      backend: "default",
      mappedTo: "prediction",
      status: "ready",
      payload: { label: "Approved", confidence: 0.92 },
    }],
  };
}
```

`request` contains serialized field values plus metadata. The response feeds reports. The runtime does not care which protocol produced it.

The application owns protocol and orchestration. MLForm owns request and report-result contracts.
