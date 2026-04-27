---
title: External Cache Store
description: Plug a distributed cache backend into MLForm transport caching.
---

```ts
import { pipe, withCache } from "mlform";

const cacheStore = {
  async get(scope, key) {
    return readFromKv(`${scope}:${key}`);
  },
  async set(scope, key, entry) {
    await writeToKv(`${scope}:${key}`, entry);
  },
  async delete(scope, key) {
    await deleteFromKv(`${scope}:${key}`);
  },
};

const transport = pipe(
  myTransport,
  withCache({
    scope: "predict-form",
    key: (request) => JSON.stringify(request.serializedValues),
    ttl: 60_000,
    store: cacheStore,
    allowUnsafeCache: true,
  }),
);
```
