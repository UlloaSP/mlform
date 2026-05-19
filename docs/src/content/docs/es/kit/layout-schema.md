---
title: Esquema De Layout
description: Referencia del DSL de layout usado por el kit headless y los layouts oficiales.
---

```ts
type FormLayoutConfig =
  | SinglePageLayoutConfig
  | WizardLayoutConfig
  | TabsLayoutConfig
  | AccordionLayoutConfig;
```

## Variantes

- `single-page`: una sola pagina con `children`
- `wizard`: flujo por `steps`
- `tabs`: flujo libre por `tabs`
- `accordion`: disclosure progresivo por `sections`

## Nodos

```ts
type FormLayoutNode =
  | {
      kind: "section";
      id?: string;
      title?: string;
      description?: string;
      children: FormLayoutNode[];
    }
  | { kind: "group"; id?: string; columns?: 1 | 2 | 3; children: FormLayoutNode[] }
  | { kind: "field"; field: string }
  | { kind: "report"; report: string };
```

## Reglas

- cada `field` debe aparecer exactamente una vez en layouts explicitos
- `report` puede aparecer cero o una vez
- referencias desconocidas fallan al crear el view
- `wizard.steps` no puede estar vacio
- `tabs.tabs` no puede estar vacio
- `accordion.sections` no puede estar vacio
- `step` y `tab` deben tener al menos un nodo
