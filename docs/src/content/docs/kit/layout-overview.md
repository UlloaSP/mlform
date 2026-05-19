---
title: Layout Overview
description: Understand the headless layout model used by createFormView and the official wizard and tabs mounts.
---

MLForm now separates:

- `schema` for data, validation, serialization, and submission
- `layout` for presentation structure and navigation

That split matters because the same form can be rendered as:

- one page
- wizard
- tabs
- accordion
- review screen
- custom React, Vue, Lit, or vanilla UI

Use these surfaces:

| Surface                | Use it for                                                          |
| ---------------------- | ------------------------------------------------------------------- |
| `mountForm()`          | built-in one-page UI with `stacked` or `split` primitive layout     |
| `mountWizardForm()`    | built-in wizard UI                                                  |
| `mountTabsForm()`      | built-in tabs UI                                                    |
| `mountAccordionForm()` | built-in accordion UI                                               |
| `createFormView()`     | headless app-facing API for custom layouts                          |
| `mlform/runtime`       | low-level state orchestration when the kit is still too opinionated |

## Why layout is external

Putting layout outside `schema` keeps responsibilities clean:

- backend-oriented schemas stay stable
- multiple UIs can reuse the same schema
- product teams can evolve navigation without redefining field semantics
- layout metadata can be local, generated, or served separately

## What createFormView resolves

`createFormView()` gives you one object that already contains:

- a `FormController`
- cloned registries
- validated and normalized layout tree
- render-ready field and report collections
- wizard navigation helpers when the layout is a wizard
- tabs navigation helpers when the layout is tabs

## Default behavior

If you omit `layout`, MLForm creates a single-page layout automatically:

1. all fields in schema order
2. all reports

Use explicit layout config when you need sections, grouping, or step navigation.
