---
title: Condiciones
description: Condiciones declarativas para visibilidad, estado disabled y read-only.
---

Los campos pueden derivar estado desde los valores actuales:

```ts
{
  id: "details",
  kind: "text",
  label: "Details",
  hiddenWhen: {
    kind: "field-value",
    field: "include_details",
    notEquals: true
  }
}
```

Tipos soportados:

| Kind                | Uso                                                                             |
| ------------------- | ------------------------------------------------------------------------------- |
| `field-value`       | Compara un campo con literales, rangos, conjuntos o estado empty/truthy.        |
| `field-comparison`  | Compara dos campos con `eq`, `neq`, `gt`, `gte`, `lt` o `lte`.                  |
| `form-status`       | Reacciona a `idle`, `editing`, `validating`, `submitting`, `success` o `error`. |
| `submit-count`      | Reacciona al numero de envios.                                                  |
| `all`, `any`, `not` | Compone otras condiciones.                                                      |
