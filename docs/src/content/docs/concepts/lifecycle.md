---
title: Lifecycle
description: What changes while a mounted form is alive.
---

A mounted MLForm moves through a small set of events:

1. Schema is normalized.
2. Field state is created.
3. Layout is resolved.
4. Fields update as users type.
5. Conditions change hidden, disabled, or read-only state.
6. Validation runs.
7. Submit serializes active values.
8. Transport returns reports or errors.
9. Report state updates.
10. `unmount()` removes listeners and DOM owned by MLForm.

Hooks let host code observe this flow without owning it. Use them for analytics, side effects, server error mapping, and cleanup coordination.

Errors belong to the stage that produced them:

| Stage | Example |
| --- | --- |
| schema/layout setup | duplicate field id, missing layout reference |
| field validation | required field, range error, custom validator failure |
| submit | abort, transport failure, payload limit |
| report fetch | async report failed after submit |

Keep lifecycle work close to the layer that owns it. Field behavior belongs near schema/runtime. Visual recovery belongs near kit or host UI. Network policy belongs in transport.
