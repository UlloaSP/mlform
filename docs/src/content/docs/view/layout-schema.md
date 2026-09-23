---
title: Layout Schema
description: Arrange schema fields and reports for a custom view or the mounted kit.
---

Pass the same `FormLayoutConfig` to `createFormView()` from `mlform/view` or `mountForm()` from
`mlform/kit`. Field and report references use normalized runtime ids from the schema.

## Layouts

| Kind | Config | Navigation |
| --- | --- | --- |
| `"stacked"` (default) | `children?: FormLayoutNode[]` | Single page. |
| `"split"` | `children?: FormLayoutNode[]` | Single page with a split built-in shell when no children are specified. |
| `"wizard"` | `steps: { id?, title, description?, children }[]` | Validates the current step before moving forward. |
| `"tabs"` | `tabs: { id?, title, description?, children }[]` | Switches freely between tabs. |

With no layout, view places each field once, followed by each report. A single-page layout with
`children` uses exactly the nodes you provide.

```ts
import type { FormLayoutConfig } from "mlform/view";

const layout: FormLayoutConfig = {
  kind: "wizard",
  steps: [
    { id: "inputs", title: "Inputs", children: [{ kind: "field", field: "prompt" }] },
    { id: "results", title: "Results", children: [{ kind: "report", report: "prediction" }] },
  ],
};
```

Wizard and tabs layouts require at least one step or tab, and each must contain a node. Ids are
optional; view derives them from titles and makes duplicates unique. Set ids explicitly when the
host refers to them through `navigation.activate(id)`.

## Nodes

- `{ kind: "field", field: "prompt" }` places a field by runtime id.
- `{ kind: "report", report: "prediction" }` places a report by runtime id.
- `{ kind: "custom", id: "materials", fields: ["material-a", "material-b"] }` reserves a
  region rendered by the application. Its fields count as placed in the layout and inherit the
  enclosing tab, wizard step, and disclosure sections. Use `createFormView()` to render it;
  `mountForm()` rejects layouts containing custom regions.
- `{ kind: "group", id?, columns?, children }` groups nodes in one, two, or three columns.
- `{ kind: "section", id?, title, description?, defaultOpen?, children }` creates a disclosure
  section. `title` must be non-empty so the built-in toggle has an accessible name. Every section
  opens by default unless `defaultOpen: false` is set.

Sections and groups can contain other sections and groups. A field inside nested sections is
visible only when **all** enclosing sections are open. To create a grouping without a disclosure
control, use `group`.

## Validation

An explicit layout must reference every field exactly once, either directly or in a custom region.
A custom region must declare at least one field. A report may be omitted or placed
once. Unknown field or report ids, duplicate references, missing fields, untitled sections, and
empty wizard steps or tabs fail when the view is created. View resolves ids before returning its
snapshot; the kit uses that same resolved layout when mounting custom sections, tabs, or steps.
