---
title: Referencia Kit
description: APIs de MLForm orientadas a aplicaciones.
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

Tipos:

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

`MountFormOptions` requiere `schema` y un `transport`.

Compón routing, fan-out, fallback, auth, retries, streaming y transforms dentro de `transport`.

Tambien acepta `containerStrategy: "replace"` cuando MLForm debe sustituir temporalmente contenido existente del host y restaurarlo en `unmount()`.
