---
title: Report Controller
description: Report state, descriptors, payloads, and errors.
---

Each report has a `ReportController`.

| Member                | Purpose                         |
| --------------------- | ------------------------------- |
| `id`                  | Stable report id.               |
| `kind`                | Report kind.                    |
| `config`              | Normalized report config.       |
| `state`               | Current report state.           |
| `descriptor`          | Renderer descriptor or `null`.  |
| `subscribe(listener)` | Listen to report state changes. |

`ReportStateSnapshot` contains:

| Field     | Meaning                                           |
| --------- | ------------------------------------------------- |
| `payload` | Raw payload selected for the report.              |
| `error`   | Report-local error message, if resolution failed. |
| `status`  | `idle`, `ready`, or `error`.                      |

Use `mappedTo` on report config for backend output keys or numeric positions.
