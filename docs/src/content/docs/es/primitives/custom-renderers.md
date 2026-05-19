---
title: Renderers personalizados
description: Mapea descriptors de presentación a custom elements.
---

```ts
import { createBuiltinPrimitiveRegistry } from "mlform/primitives";

customElements.define("risk-band-field", RiskBandFieldElement);

const primitiveRegistry = createBuiltinPrimitiveRegistry().registerField(
  "risk-band-field",
  "risk-band-field",
);
```

Los nombres de custom elements deben incluir un guion. Los elementos reciben `controller`, `descriptor` y contexto.
