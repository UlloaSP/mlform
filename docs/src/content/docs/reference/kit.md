---
title: Kit Reference
description: Application-facing MLForm APIs.
---

Exports:

- `mountForm(container, options)`
- `unmountForm(mounted)`
- `createJsonTransport(options)`
- `createRoutingTransport(options)`
- `createFanoutTransport(options)`
- `createFallbackTransport(options)`
- `createPipelineTransport(options)`
- `createRacingTransport(options)`
- `pipe(transport, ...middleware)`
- `withAuth(options)`
- `withRetry(options)`
- `withTimeout(ms)`
- `withCircuitBreaker(options)`
- `withRateLimit(options)`
- `withDedup(options)`
- `withCache(options)`
- `withRequestTransform(fn)`
- `withResponseTransform(fn)`
- `withLogging(options)`
- `defaultKitDesignSystem`
- `defaultKitLabels`

Types:

- `MountFormOptions`
- `MountedForm`
- `JsonTransportOptions`
- `JsonTransportMethod`
- `RoutingTransportOptions`
- `FanoutTransportOptions`
- `FanoutTransportResult`
- `FallbackTransportOptions`
- `FallbackTransportFailure`
- `PipelineTransportOptions`
- `RacingTransportOptions`
- `AuthOptions`
- `RetryOptions`
- `CircuitBreakerOptions`
- `RateLimitOptions`
- `DedupOptions`
- `CacheOptions`
- `TransportCollection`
- `KitLabels`
- `KitDesignSystemSnapshot`

`MountFormOptions` requires `schema` and one `transport`.

Compose routing, fan-out, fallback, auth, retries, streaming, and transforms inside `transport`.

It also forwards engine-level knobs such as `inactiveFieldPolicy`, `hookFailurePolicy`, `listenerErrorPolicy`, and `onListenerError`.

It also accepts `containerStrategy: "replace"` when MLForm should temporarily replace existing host content and restore it on `unmount()`.
