---
title: Report Controller
description: Report state, descriptors, payloads, and errors.
---

Each report has a `ReportController`.

| Member                | Purpose                                      |
| --------------------- | -------------------------------------------- |
| `id`                  | Stable report id.                            |
| `kind`                | Report kind.                                 |
| `config`              | Normalized report config.                    |
| `state`               | Current report state.                        |
| `canFetch`            | Whether the definition provides fetch I/O.   |
| `fetch(request)`      | Fetch the report unless a fetch is pending.  |
| `refresh(request)`    | Cancel any pending fetch and start a new one.|
| `abort()`             | Cancel the pending fetch.                    |
| `subscribe(listener)` | Listen to report state changes.              |

`ReportStateSnapshot` contains:

| Field     | Meaning                                           |
| --------- | ------------------------------------------------- |
| `payload` | Raw payload selected for the report.              |
| `error`   | Report-local error message, if resolution failed. |
| `status`  | `idle`, `loading`, `ready`, `skipped`, or `error`.|

Use `mappedTo` on report config for backend output keys or numeric positions.
