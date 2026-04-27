---
title: Shared Policy Backends
description: Implement external cache, limiter, breaker, and health backends for MLForm transport policies.
---

MLForm ships in-memory reference implementations and stable interfaces for external backends.

Shared interfaces:

- `TransportCacheStore`
- `SharedRateLimiter`
- `CircuitBreakerSharedState`
- `TransportHealthState`

All of them are scope-aware. That means your backend should isolate policy state by `scope`.

Example cache signature:

```ts
interface TransportCacheStore {
  get(scope: string, key: string): Promise<TransportCacheEntry | undefined>;
  set(scope: string, key: string, entry: TransportCacheEntry): Promise<void>;
  delete(scope: string, key: string): Promise<void>;
}
```

Use memory implementations for single-process apps. Use a distributed backend when many workers must share quota, breaker state, or cached responses.
