---
title: Layout Errors
description: Understand the validation errors raised when a layout config is invalid.
---

## Duplicate field

Error:

```txt
Field "name" appears multiple times in layout.
```

Cause:

- the same field was referenced more than once

Fix:

- keep each field in exactly one explicit layout location

## Missing field

Error:

```txt
Field "email" is missing from layout.
```

Cause:

- explicit layout did not cover every field

Fix:

- add the field somewhere in the layout

## Unknown reference

Examples:

- `Layout references unknown field "foo".`
- `Layout references unknown report "risk-v2".`
- `Layout references unknown explanation "why".`

Fix:

- align layout ids with normalized schema ids

## Empty wizard

Errors:

- `Wizard layout must define at least one step.`
- `Wizard step "profile" must contain at least one layout node.`

## Empty tabs

Errors:

- `Tabs layout must define at least one tab.`
- `Tab "profile" must contain at least one layout node.`

## Empty accordion

Errors:

- `Accordion layout must define at least one section.`
- `Accordion section "profile" must contain at least one layout node.`

## Wrong API on non-wizard layouts

Example:

```txt
goToStep() is only available for wizard layouts.
```

Fix:

- use wizard navigation only when `layout.kind === "wizard"`

Tabs example:

```txt
setActiveTab() is only available for tabs layouts.
```

Accordion example:

```txt
Accordion section controls are only available for accordion layouts.
```

## Debugging checklist

1. confirm field ids in the final normalized schema
2. confirm every field appears once
3. confirm report and explanation ids match schema ids
4. confirm step titles or explicit ids are what your host expects
