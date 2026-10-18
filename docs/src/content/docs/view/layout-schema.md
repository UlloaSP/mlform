---
title: Layout config
description: Reference for FormLayoutConfig, its node types, the validation rules, and every layout error message.
---

The same `FormLayoutConfig` works in `mountForm` and `createFormView`. The guide with screenshots is
[Layouts](/view/layouts/).

## Types

```ts
type FormLayoutConfig =
  | { kind?: "stacked" | "split"; children?: FormLayoutNode[] }
  | { kind: "wizard"; steps: { id?: string; title: string; description?: string; children: FormLayoutNode[] }[] }
  | { kind: "tabs"; tabs: { id?: string; title: string; description?: string; children: FormLayoutNode[] }[] };

type FormLayoutNode =
  | { kind: "field"; field: string }
  | { kind: "report"; report: string }
  | { kind: "group"; id?: string; columns?: 1 | 2 | 3; children: FormLayoutNode[] }
  | { kind: "section"; id?: string; title: string; description?: string; defaultOpen?: boolean; children: FormLayoutNode[] }
  | { kind: "custom"; id: string; fields: readonly string[] };
```

All types are exported from `mlform/view`, together with their resolved forms
(`ResolvedFormLayout`, `ResolvedFormLayoutNode`…) in which every id is filled in and `defaultOpen`
is a boolean.

## Rules

- Without `layout`, or with a stacked or split layout without `children`, every field is placed in
  schema order, followed by every report.
- An explicit layout places every field exactly once, directly or through a `custom` node's `fields`.
- A report is placed at most once; reports left out are not rendered.
- `field`, `report`, and `custom` references use exact runtime ids.
- Wizards and tabs need at least one step or tab, and each needs at least one node.
- Sections need a non-empty `title`; they start open unless `defaultOpen: false`.
- Steps, tabs, sections, and groups without `id` get one from their title (or kind), made unique
  with a numeric suffix.
- Custom nodes need at least one field and are rendered only by your code through
  `createFormView`; `mountForm` rejects them.

## Errors

Layout errors are `TypeError`s thrown when the form is created, or by navigation calls.

| Message | Cause |
| --- | --- |
| `Layout references unknown field "x".` | A node names a field id that is not in the normalized schema. |
| `Layout references unknown report "x".` | The same for a report. |
| `Field "x" appears multiple times in layout.` | A field is placed twice, including through custom nodes. |
| `Report "x" appears multiple times in layout.` | A report is placed twice. |
| `Field "x" is missing from layout.` | An explicit layout leaves a field out. |
| `Disclosure sections require a non-empty title.` | A section without `title`. |
| `Custom region "x" must declare at least one field.` | A custom node with empty `fields`. |
| `Wizard layout must define at least one step.` | `steps: []`. |
| `Wizard step "x" must contain at least one layout node.` | An empty step. |
| `Tabs layout must define at least one tab.` | `tabs: []`. |
| `Tab "x" must contain at least one layout node.` | An empty tab. |
| `Unknown wizard step "x".`, `Unknown tab "x".` | `navigation.activate(id)` with an id the layout does not have. |
| `Unknown disclosure section "x".` | A disclosure call with an unknown section id. |

When a reference fails, compare it with `view.form.fields.map((field) => field.id)`.
An explicit `customer_age` stays `customer_age`; only omitted ids are generated from labels.
