---
title: Schema
description: El contrato del formulario compartido por UI, runtime y backend.
---

`FormSchema` nombra los inputs que MLForm recoge y los reports que espera recibir.

```ts
import type { FormSchema } from "mlform/schema";

const schema: FormSchema = {
  fields: [
    { id: "age", kind: "number", label: "Age", min: 0, max: 120, required: true },
  ],
  reports: [{ id: "risk", kind: "classifier", label: "Risk" }],
};
```

Usa `id` estables en produccion. MLForm puede derivar ids desde labels, pero ids explicitos son handles runtime para estado UI, layout refs, validacion, foco, tests y analytics. Las claves backend van en `mappedTo`. Las claves de review, persistencia y export van en `displayKey`; campos sin `displayKey` se omiten de `displayValues`. Los labels son copy visible, no claves de datos.

Usa `form.getField(id)` y `form.getReport(id)` solo para handles runtime. Usa `form.getFieldByDisplayKey(key)` para campos de review/export y `form.getFieldByMappedTo(target, { backend })` para campos ligados al modelo.

Terminos base:

| Termino | Significado |
| --- | --- |
| field | Un valor que el usuario introduce. |
| report | Una salida de modelo mostrada despues de submit o fetch. |
| kind | Clave de registry que selecciona validacion y descriptor UI. |
| condition | Regla como `hiddenWhen`, `disabledWhen` o `readOnlyWhen`. |
| normalized schema | Schema listo para runtime tras resolver ids, defaults, reports y registry checks. |
| inactive field | Campo hidden, disabled o read-only. Su envio depende de policy. |

Schema describe significado, no colocacion en pantalla. Grupos, pasos, tabs y review screens van en layout.

## Tooling dirigido por el registry

Usa el mismo registry para runtime, diagnosticos y autocompletado del editor:

```ts
import { findUnknownKinds, toSchemaJsonSchema, validateSchema } from "mlform/schema";

const validation = validateSchema(input, registry);
const jsonSchema = toSchemaJsonSchema(registry);
const unknownKinds = findUnknownKinds(input, registry);
```

`validateSchema` devuelve datos normalizados o issues con path. El JSON Schema incluye todas las definiciones de fields y reports registradas, incluidos los plugins de la aplicacion.
