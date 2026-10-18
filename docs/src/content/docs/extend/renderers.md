---
title: Registries and renderers
description: The three registries behind every form, how a kind becomes a rendered element, and when to work with them directly.
---

A rendered field passes through three registries, each owned by one layer:

| Registry | Layer | Maps | Created by |
| --- | --- | --- | --- |
| Engine registry | `mlform/schema`, runtime | `kind` to a definition (schema, values, validation) | `createRegistry()`, `createBuiltinMlRegistry()` from `mlform/builtins` |
| Descriptor registry | `mlform/view` | `kind` to a presenter that returns a descriptor `{ component, props }` | `createPrimitiveDescriptorRegistry()`, `createBuiltinDescriptorRegistry()` from `mlform/view` |
| Primitive registry | `mlform/primitives` | descriptor `component` to a custom element tag | `createPrimitiveRegistry()`, `createBuiltinPrimitiveRegistry()` |

A [plugin](/extend/plugins/) fills the first two for you. You only touch the primitive registry
when a presenter names a component that MLForm does not ship, as the
[compass field](/extend/custom-fields/#your-own-element) does.

## Engine registry

```ts
import { createBuiltinMlRegistry } from "mlform/builtins";
import { createRegistry, defineFieldDefinition } from "mlform/schema";

const empty = createRegistry();
const builtins = createBuiltinMlRegistry().registerField(myDefinition);
```

Methods: `registerField`, `registerReport`, `unregisterField`, `unregisterReport`, `getField`,
`getReport`, `listFields`, `listReports`. Registering an existing kind throws `RegistryError`.
`createForm` requires an engine registry; `createFormView` and `mountForm` accept one as `registry`
and copy it, so later changes do not affect existing forms.

## Descriptor registry

Presenters turn a field's config and state into a descriptor. `registerField(presenter)` and
`registerReport(presenter)` add one per kind; duplicates throw. `createFormView` and `mountForm`
accept `descriptorRegistry`. Without it they use the built-in presenters plus those added by
plugins.

## Primitive registry

```ts
import { createBuiltinPrimitiveRegistry } from "mlform/primitives";

const primitiveRegistry = createBuiltinPrimitiveRegistry()
  .registerField("wind-direction-field", "wind-direction-field")
  .registerReport("risk-band", "risk-band-report");
```

| Method | Purpose |
| --- | --- |
| `registerField(component, tagName)`, `registerReport(component, tagName)` | Map a descriptor component to a custom element. |
| `unregisterField(component)`, `unregisterReport(component)` | Remove a mapping. |
| `resolveField(component)`, `resolveReport(component)` | Look up a tag. |
| `clone()` | Copy for isolated changes. |

Tags must be valid custom element names (lowercase, with a hyphen). A component with no mapping
renders `mlf-unsupported-component`, which names the missing mapping. Pass the registry to
`mountForm`, `mountPrimitiveForm`, or `createPrimitiveAdapter` as `primitiveRegistry`; each copies it.

## Element base classes

| Class | Receives | Helpers |
| --- | --- | --- |
| `PrimitiveFieldElement` | `controller`, `descriptor`, `context` (ids, label, errors, required, disabled, read-only), `text` | `props`, `commitValue()`, `commitBlur()`, `getControlAttributes()`, `renderAssistiveText()` |
| `PrimitiveReportElement` | `controller`, `descriptor`, `context`, `text`, `transport`, `request` | `props` |
| `PrimitiveAsyncReportElement` | as above | Calls `transport.submit(request)` when both are set and renders the result panel, as the built-in reports do for `reportTransport`. |

All three are Lit elements exported from `mlform/primitives`. Define your element with
`customElements.define` before the form renders.
