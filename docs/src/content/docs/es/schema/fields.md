---
title: Campos
description: Tipos de campo integrados y opciones compartidas.
---

Tipos de campo integrados:

| Kind       | Valor            | Opciones                                                                                                                     |
| ---------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `text`     | `string`         | `placeholder`, `minLength`, `maxLength`, `pattern`                                                                           |
| `number`   | `number \| null` | `min`, `max`, `step`, `unit`, `placeholder`                                                                                  |
| `boolean`  | `boolean`        | `required` exige `true`                                                                                                      |
| `category` | `string \| null` | `options` como strings o `{ label, value }`                                                                                  |
| `date`     | `Date \| null`   | `min`, `max`, `step`                                                                                                         |
| `series`   | array de puntos  | `minPoints`, `maxPoints`, `granularity`, `ordered`, `uniqueTimestamps`, `minDate`, `maxDate`, `minValue`, `maxValue`, `unit` |

Opciones compartidas:

```ts
{
  id: "email",
  kind: "text",
  label: "Email",
  description: "Used for notifications.",
  required: true,
  defaultValue: "",
  hiddenWhen: { kind: "field-value", field: "anonymous", equals: true },
  ui: { autocomplete: "email" }
}
```
