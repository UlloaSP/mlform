---
title: Recetas De Layout
description: Patrones reutilizables para secciones, groups, wizard, tabs y review screens.
---

## Single page

```ts
{
  kind: "stacked",
  children: [{ kind: "field", field: "name" }],
}
```

## Wizard simple

```ts
{
  kind: "wizard",
  steps: [
    { title: "Perfil", children: [{ kind: "field", field: "name" }] },
    { title: "Revision", children: [{ kind: "report", report: "risk" }] },
  ],
}
```

## Tabs

```ts
{
  kind: "tabs",
  tabs: [
    { title: "Perfil", children: [{ kind: "field", field: "name" }] },
    { title: "Resultados", children: [{ kind: "report", report: "risk" }] },
  ],
}
```

## Disclosure

```ts
{
  kind: "stacked",
  sections: [
    { title: "Perfil", children: [{ kind: "field", field: "name" }] },
    { title: "Resultados", children: [{ kind: "report", report: "risk" }] },
  ],
}
```
