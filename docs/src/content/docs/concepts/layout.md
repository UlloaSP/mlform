---
title: Layout
description: How MLForm separates field meaning from screen structure.
---

`schema` is not layout. A field can keep the same id, validation, default value, and backend meaning while moving between one page, tabs, wizard steps, or a custom shell.

`layout` handles screen structure:

| Layout idea | Meaning |
| --- | --- |
| `stacked` | Fields and reports render in order. |
| `split` | Built-in two-area primitive layout. |
| `wizard` | Step-by-step navigation over layout nodes. |
| `tabs` | Tab navigation over layout nodes. |
| `section` | Grouping node; can also behave as disclosure. |
| headless layout | `createFormView()` returns render-ready nodes and navigation state for your UI. |

The same layout config can go through built-in kit mounts or a custom host. Built-in paths use `mountForm()`. Custom hosts use `createFormView()`.

Keep field semantics out of layout metadata. Put labels, validation, ids, and backend keys in schema. Put grouping, ordering, steps, tabs, and review screens in layout.
