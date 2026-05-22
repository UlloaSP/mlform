---
title: Shared Rate Limiter
description: Share request quotas across many MLForm processes.
---

```ts
import { pipe, withRateLimit } from "mlform/transport";

const limiter = {
  async acquire(scope, lease) {
    await claimQuota(scope, lease.maxConcurrent, lease.perSecond);
    return {
      async release() {
        await releaseQuota(scope);
      },
    };
  },
};

const transport = pipe(
  myTransport,
  withRateLimit({
    scope: "shared-openai-quota",
    maxConcurrent: 8,
    perSecond: 20,
    limiter,
  }),
);
```
