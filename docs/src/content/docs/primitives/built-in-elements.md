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
| `mlf-report-frame`          | Report wrapper.                                    |
| `mlf-text-field`            | Text field renderer.                               |
| `mlf-number-field`          | Number field renderer.                             |
| `mlf-boolean-field`         | Boolean field renderer.                            |
| `mlf-category-field`        | Category field renderer.                           |
| `mlf-date-field`            | Date field renderer.                               |
| `mlf-series-field`          | Series field renderer.                             |
| `mlf-classifier-report`     | Classifier report renderer.                        |
| `mlf-regressor-report`      | Regressor report renderer.                         |

Custom renderers should use valid custom element names with a hyphen.
