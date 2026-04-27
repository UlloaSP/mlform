---
title: Validación
description: Validación de campos, formularios, reglas async y errores.
---

MLForm valida en tres niveles:

| Nivel                     | Uso                                                        |
| ------------------------- | ---------------------------------------------------------- |
| Built-in field validation | `required`, `min`, `max`, `minLength`, opciones inválidas. |
| Custom field validation   | Reglas dentro de una definición de campo propia.           |
| Form validators           | Reglas cross-field o de negocio.                           |

```ts
validators: [
  ({ values }) => {
    if (Number(values.min_score) > Number(values.max_score)) {
      return { fields: { max_score: ["Max score must be greater than min score."] } };
    }
  },
];
```

Los validators pueden ser async. Usa `asyncValidationDebounceMs` para campos con validación remota o costosa.
