---
title: Kit Reference
description: Application-facing MLForm APIs.
---

Exports:

- `createFormView(options)`
- `mountWizardForm(container, options)`
- `mountTabsForm(container, options)`
- `mountAccordionForm(container, options)`
- `mountForm(container, options)`
- `unmountForm(mounted)`
- `walkLayoutNodes(layout, visitor)`
- `flattenLayoutNodes(layout)`
- `collectLayoutReferences(layout)`
- `createJsonTransport(options)`
- `createGraphqlTransport(options)`
- `createSseTransport(options)`
- `createWebSocketSessionTransport(options)`
- `createGrpcUnaryTransport(options)`
- `createGrpcStreamTransport(options)`
- `createGrpcSessionTransport(options)`
- `createGrpcTransport(options)`
- `createRoutingTransport(options)`
- `createWeightedRoutingTransport(options)`
- `createFanoutTransport(options)`
- `createQuorumFanoutTransport(options)`
- `createFallbackTransport(options)`
- `createLoadBalancedTransport(options)`
- `createHedgedTransport(options)`
- `createPipelineTransport(options)`
- `createRacingTransport(options)`
- `pipe(transport, ...middleware)`
- `assertTransportCapabilities(transport, requirement, context)`
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
- `withTracing(options)`
- `withMetrics(options)`
- `defaultKitDesignSystem`
- `defaultKitLabels`

Types:

- `CreateFormViewOptions`
- `FormLayoutConfig`
- `FormLayoutNode`
- `FormViewState`
- `FormViewController`
- `FormViewSnapshot`
- `WizardLayoutConfig`
- `WizardStepConfig`
- `WizardState`
- `TabsLayoutConfig`
- `TabLayoutConfig`
- `TabsState`
- `AccordionLayoutConfig`
- `AccordionSectionConfig`
- `AccordionState`
- `MountFormOptions`
- `MountWizardFormOptions`
- `MountTabsFormOptions`
- `MountAccordionFormOptions`
- `MountedForm`
- `MountedWizardForm`
- `MountedTabsForm`
- `MountedAccordionForm`
- `JsonTransportOptions`
- `JsonTransportMethod`
- `RoutingTransportOptions`
- `WeightedRoutingTransportOptions`
- `FanoutTransportOptions`
- `FanoutTransportResult`
- `QuorumFanoutTransportOptions`
- `FallbackTransportOptions`
- `FallbackTransportFailure`
- `LoadBalancingTransportOptions`
- `PipelineTransportOptions`
- `RacingTransportOptions`
- `HedgedTransportOptions`
- `AuthOptions`
- `CapabilityRequirement`
- `RetryOptions`
- `CircuitBreakerOptions`
- `RateLimitOptions`
- `RateLimitLeaseRequest`
- `DedupOptions`
- `CacheOptions`
- `TransportCollection`
- `TransportCacheStore`
- `SharedRateLimiter`
- `CircuitBreakerSharedState`
- `TransportHealthState`
- `KitLabels`
- `KitDesignSystemSnapshot`

`MountFormOptions` requires `schema` and one `transport`.

`createFormView()` uses the same schema and transport inputs, but returns a headless snapshot API instead of mounting DOM.

`mountWizardForm()` consumes the same layout contract when `layout.kind === "wizard"` and renders the official built-in wizard shell.

`mountTabsForm()` consumes the same layout contract when `layout.kind === "tabs"` and renders the official built-in tabs shell.

`mountAccordionForm()` consumes the same layout contract when `layout.kind === "accordion"` and renders the official built-in accordion shell.

Compose routing, fan-out, fallback, auth, retries, streaming, and transforms inside `transport`.

Built-in middleware and orchestration read normalized `transport.capabilities`, enforce capability requirements, and pass scoped policy context to cache, limiter, circuit-breaker, and health backends.

It also forwards engine-level knobs such as `inactiveFieldPolicy`, `hookFailurePolicy`, `listenerErrorPolicy`, and `onListenerError`.

It also accepts `containerStrategy: "replace"` when MLForm should temporarily replace existing host content and restore it on `unmount()`.
