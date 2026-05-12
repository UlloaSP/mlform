---
title: Layout Recipes
description: Reusable layout patterns for sections, groups, wizards, review steps, and result screens.
---

## One-page sections

```ts
{
  kind: "single-page",
  children: [
    {
      kind: "section",
      title: "Applicant",
      children: [
        { kind: "field", field: "name" },
        { kind: "field", field: "email" },
      ],
    },
    {
      kind: "section",
      title: "Model output",
      children: [{ kind: "report", report: "risk" }],
    },
  ],
}
```

## Two-column data entry

```ts
{
  kind: "single-page",
  children: [
    {
      kind: "group",
      columns: 2,
      children: [
        { kind: "field", field: "age" },
        { kind: "field", field: "income" },
      ],
    },
  ],
}
```

## Simple wizard

```ts
{
  kind: "wizard",
  steps: [
    { title: "Profile", children: [{ kind: "field", field: "name" }] },
    { title: "Assessment", children: [{ kind: "field", field: "score" }] },
  ],
}
```

## Final review step

```ts
{
  kind: "wizard",
  steps: [
    { title: "Inputs", children: [{ kind: "field", field: "name" }] },
    {
      title: "Review",
      children: [
        { kind: "report", report: "risk" },
        { kind: "explanation", explanation: "why" },
      ],
    },
  ],
}
```

## Built-in tabs

```ts
{
  kind: "tabs",
  tabs: [
    { title: "Applicant", children: [{ kind: "field", field: "name" }] },
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

## Built-in accordion

```ts
{
  kind: "accordion",
  sections: [
    { title: "Applicant", children: [{ kind: "field", field: "name" }] },
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

## Nested section inside a step

```ts
{
  kind: "wizard",
  steps: [
    {
      title: "Profile",
      children: [
        {
          kind: "section",
          title: "Identity",
          children: [
            { kind: "field", field: "name" },
            { kind: "field", field: "email" },
          ],
        },
      ],
    },
  ],
}
```

## Explanations after submit

Put explanations in the final step or in a post-submit section on single-page layouts.

## Picking a recipe

- choose wizard when the user should focus on one decision chunk at a time
- choose tabs when users need free section switching without validation gates
- choose accordion when users need progressive disclosure and multi-open sections
- choose single-page when cross-field comparison matters
- choose grouped columns when the data is dense but still scan-friendly
- choose review step when reports need narrative framing before final submission
