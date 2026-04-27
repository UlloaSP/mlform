---
title: Arquitectura
description: Como MLForm separa estado, renderizado, transporte y estilos.
---

MLForm se divide en cuatro superficies publicas.

| Superficie    | Import                  | Responsabilidad                                                  |
| ------------- | ----------------------- | ---------------------------------------------------------------- |
| Kit           | `mlform` o `mlform/kit` | Ruta por defecto para montar formularios en aplicaciones.        |
| Engine        | `mlform/engine`         | Estado, validacion, registry, hooks y flujo de envio.            |
| Primitives    | `mlform/primitives`     | Web Components integrados y registry de renderers.               |
| Design system | `mlform/design-system`  | Themes, recipes, resolucion de tokens e integracion con el host. |

Usa el kit en codigo de aplicacion. Baja a engine o primitives solo para renderers, registries o capas de integracion personalizadas.

```ts
import { createJsonTransport, mountForm } from "mlform";
import type { FormSchema } from "mlform/engine";

const schema: FormSchema = {
  fields: [{ kind: "text", label: "Prompt" }],
};

mountForm(container, { transport: createJsonTransport({ endpoint: "/predict" }), schema });
```
