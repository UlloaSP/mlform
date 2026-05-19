---
title: Layout Schema
description: Reference for the layout DSL used by the headless kit and official wizard and tabs layouts.
---

## Top-level layout config

```ts
type FormLayoutConfig = SinglePageLayoutConfig | WizardLayoutConfig | TabsLayoutConfig;
type FormLayoutConfig =
  | SinglePageLayoutConfig
  | WizardLayoutConfig
  | TabsLayoutConfig
  | AccordionLayoutConfig;
```

### `SinglePageLayoutConfig`

```ts
interface SinglePageLayoutConfig {
  kind?: "single-page";
  children?: FormLayoutNode[];
}
```

Use for:

- one-page custom UIs
- sectioned dashboards
- review or analyst screens

### `WizardLayoutConfig`

```ts
interface WizardLayoutConfig {
  kind: "wizard";
  steps: WizardStepConfig[];
}
```

Use for:

- multi-step flows
- onboarding
- staged data collection
- step-by-step review

### `TabsLayoutConfig`

```ts
interface TabsLayoutConfig {
  kind: "tabs";
  tabs: TabLayoutConfig[];
}
```

Use for:

- free section switching
- app-like shells with persistent submit
- analytical workflows that should not validate on navigation

## Wizard steps

```ts
interface WizardStepConfig {
  id?: string;
  title: string;
  description?: string;
  children: FormLayoutNode[];
}
```

Rules:

- `steps` must not be empty
- each step must contain at least one node
- each field must belong to exactly one step
- `id` is optional and auto-generated from `title`

## Tabs

```ts
interface TabLayoutConfig {
  id?: string;
  title: string;
  description?: string;
  children: FormLayoutNode[];
}
```

Rules:

- `tabs` must not be empty
- each tab must contain at least one node
- each field must belong to exactly one tab
- `id` is optional and auto-generated from `title`
- switching tabs does not validate

### `AccordionLayoutConfig`

```ts
interface AccordionLayoutConfig {
  kind: "accordion";
  sections: AccordionSectionConfig[];
}
```

Use for:

- progressive disclosure
- dense forms on mobile
- review flows where multiple regions can remain open

```ts
interface AccordionSectionConfig {
  id?: string;
  title: string;
  description?: string;
  children: FormLayoutNode[];
  defaultOpen?: boolean;
}
```

Rules:

- `sections` must not be empty
- each section must contain at least one node
- each field must belong to exactly one section
- first section defaults to open unless overridden

## Node types

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

### `section`

Use `section` for semantic grouping and copy.

```ts
{
  kind: "section",
  title: "Applicant",
  description: "Core identity data.",
  children: [
    { kind: "field", field: "name" },
    { kind: "field", field: "email" },
  ],
}
```

### `group`

Use `group` for visual grouping and column hints.

```ts
{
  kind: "group",
  columns: 2,
  children: [
    { kind: "field", field: "city" },
    { kind: "field", field: "zip" },
  ],
}
```

### `field`

References a field id from the normalized form schema.

```ts
{ kind: "field", field: "name" }
```

### `report`

References a report id.

```ts
{ kind: "report", report: "risk" }
```

## Validation rules

When layout is explicit:

- every field must appear exactly once
- reports may appear zero or one time
- unknown references fail creation immediately
- missing fields fail creation immediately

## Generated ids

MLForm auto-generates ids for:

- sections
- groups
- wizard steps

Generated ids are slug-based and stable relative to config order.

## Example layouts

### Single page with sections

```ts
{
  kind: "single-page",
  children: [
    {
      kind: "section",
      title: "Profile",
      children: [
        { kind: "field", field: "name" },
        { kind: "field", field: "email" },
      ],
    },
    {
      kind: "section",
      title: "Outputs",
      children: [{ kind: "report", report: "risk" }],
    },
  ],
}
```

### Wizard with review step

```ts
{
  kind: "wizard",
  steps: [
    {
      title: "Profile",
      children: [{ kind: "field", field: "name" }],
    },
    {
      title: "Assessment",
      children: [{ kind: "field", field: "score" }],
    },
    {
      title: "Review",
      children: [
        { kind: "report", report: "risk" },
        { kind: "report", report: "why" },
      ],
    },
  ],
}
```

### Tabs with result panel

```ts
{
  kind: "tabs",
  tabs: [
    {
      title: "Profile",
      children: [{ kind: "field", field: "name" }],
    },
    {
      title: "Assessment",
      children: [
        { kind: "field", field: "score" },
        { kind: "report", report: "risk" },
      ],
    },
  ],
}
```

### Accordion with progressive disclosure

```ts
{
  kind: "accordion",
  sections: [
    {
      title: "Profile",
      children: [{ kind: "field", field: "name" }],
    },
    {
      title: "Assessment",
      children: [
        { kind: "field", field: "score" },
        { kind: "report", report: "risk" },
      ],
    },
  ],
}
```
