---
title: Performance
description: Keep forms responsive by mounting once, subscribing narrowly, and bounding expensive inputs.
---

| Topic | Recommendation |
| --- | --- |
| Mounting | Mount once per view and `unmount()` on teardown. Never remount to show new values; use `form.setValues()` or `restoreSnapshot()`. |
| Schemas | Keep schema, layout, and transport objects stable in framework components so effects do not remount the form. |
| Subscriptions | Use `subscribeSelector` with a narrow selector for previews and badges instead of `subscribe` to the whole state. |
| Reads | `form.getField(id).state` is cheaper to reason about than diffing `form.state` yourself. |
| Asynchronous validation | Set `asyncValidationDebounceMs` on fields whose validators call a service. |
| Series | Bound `maxPoints` for large inputs; every row is validated and aggregated on change. |
| Reports | Keep payloads to what the report shows; use [report fetches](/guides/report-fetches/) with `reportFetchMode: "lazy"` for heavy, optional content. |
| Custom renderers | Update existing elements on each snapshot instead of recreating them. |

Snapshots are frozen and keep their identity until something changes, so equality checks are cheap
and safe for framework stores.
