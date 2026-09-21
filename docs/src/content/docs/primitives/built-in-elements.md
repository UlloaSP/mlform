---
title: Built-in Elements
description: Custom elements registered by MLForm primitives.
---

| Element                     | Purpose                                            |
| --------------------------- | -------------------------------------------------- |
| `mlf-form`                  | Main primitive form host.                          |
| `mlf-form-errors`           | Form-level errors.                                 |
| `mlf-submit-button`         | Submit control.                                    |
| `mlf-unsupported-component` | Fallback for missing primitive mappings.           |
| `mlf-field-frame`           | Field wrapper with label, description, and errors. |
| `mlf-report-frame`          | Report wrapper with accessible lifecycle states.  |
| `mlf-text-field`            | Text field renderer.                               |
| `mlf-number-field`          | Number field renderer.                             |
| `mlf-boolean-field`         | Boolean field renderer.                            |
| `mlf-category-field`        | Category field renderer.                           |
| `mlf-date-field`            | Date field renderer.                               |
| `mlf-series-field`          | Series field renderer.                             |
| `mlf-classifier-report`     | Classifier report renderer.                        |
| `mlf-regressor-report`      | Regressor report renderer.                         |

Custom renderers should use valid custom element names with a hyphen.

`mlf-form` summarizes a report collection while every report is idle or loading. Once reports
settle independently, each `mlf-report-frame` displays its skipped or error state, or mounts the
registered renderer for ready content. Override `reportsEmptyTitle`, `reportsEmptyBody`,
`reportStateTitle`, and `reportStateMessage` through primitive text when the host needs different
copy. Report descriptions are collapsed by default and exposed through the frame's help button;
set `ui.showDescriptionInline` to `true` when a report description should start expanded.
