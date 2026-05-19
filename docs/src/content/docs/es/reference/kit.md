---
title: Referencia Kit
description: APIs de MLForm orientadas a aplicaciones.
---

Exports:

- `createFormView(options)`
- `mountForm(container, options)`
- `unmountForm(mounted)`
- `walkLayoutNodes(layout, visitor)`
- `flattenLayoutNodes(layout)`
- `collectLayoutReferences(layout)`
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

- `CreateFormViewOptions`
- `FormLayoutConfig`
- `FormViewController`
- `FormViewSnapshot`
- `FormViewState`
- `WizardLayoutConfig`
- `WizardStepConfig`
- `WizardState`
- `TabsLayoutConfig`
- `TabLayoutConfig`
- `TabsState`
- `FormLayoutConfig`
- `FormLayoutSectionNode`
- `DisclosureState`
- `MountFormOptions`
- `MountWizardFormOptions`
- `MountTabsFormOptions`
- `MountFormOptions`
- `MountedForm`
- `MountedWizardForm`
- `MountedTabsForm`
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

`createFormView()` devuelve una API headless.

`mountForm()` monta los layout oficiales.

Compón routing, fan-out, fallback, auth, retries, streaming y transforms dentro de `transport`.

Tambien acepta `containerStrategy: "replace"` cuando MLForm debe sustituir temporalmente contenido existente del host y restaurarlo en `unmount()`.
