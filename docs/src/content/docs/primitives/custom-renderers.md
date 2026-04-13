---
title: Custom Renderers
description: Map engine descriptors to custom Web Components.
---

Use a primitive registry when a custom field or report returns a custom `component` value.

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

Custom elements receive `controller`, `descriptor`, and context properties. Re-render when those properties change.
