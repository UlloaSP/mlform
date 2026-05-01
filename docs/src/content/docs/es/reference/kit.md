---
title: Referencia Kit
description: APIs de MLForm orientadas a aplicaciones.
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

`mountWizardForm()` monta el wizard oficial.

`mountTabsForm()` monta el layout oficial de tabs.

`mountAccordionForm()` monta el layout oficial de accordion.

Compón routing, fan-out, fallback, auth, retries, streaming y transforms dentro de `transport`.

Tambien acepta `containerStrategy: "replace"` cuando MLForm debe sustituir temporalmente contenido existente del host y restaurarlo en `unmount()`.
