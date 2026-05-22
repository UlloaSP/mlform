---
title: Custom Renderers
description: Map primitive descriptors to custom Web Components.
---

Use a primitive registry when you intentionally opt into the advanced path and return a custom `component` value from a low-level definition.

For most custom kinds, prefer `defineFieldKind` or `defineReportKind` from `mlform/kit`. Register those helpers with both the schema registry and descriptor registry; they use built-in declarative renderers and do not require primitive registry wiring.

```ts
import { createBuiltinPrimitiveRegistry } from "mlform/primitives";

customElements.define("risk-band-field", RiskBandFieldElement);

const primitiveRegistry = createBuiltinPrimitiveRegistry().registerField(
  "risk-band-field",
  "risk-band-field",
);

mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema,
  primitiveRegistry,
});
```

| Method                               | Purpose                                          |
| ------------------------------------ | ------------------------------------------------ |
| `registerField(component, tagName)`  | Map a field descriptor component to an element.  |
| `registerReport(component, tagName)` | Map a report descriptor component to an element. |
| `resolveField(component)`            | Resolve a field tag.                             |
| `resolveReport(component)`           | Resolve a report tag.                            |
| `clone()`                            | Copy a registry for isolated mutation.           |

Custom report elements receive `controller`, `descriptor`, `context`, `transport`, and `request` properties. Use `transport.submit(request)` to fetch post-submit content, or extend `PrimitiveAsyncReportElement` from `mlform/primitives` to reuse that lifecycle.
