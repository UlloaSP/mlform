---
title: Accessibility
description: Build MLForm integrations that remain usable with keyboard and assistive technology.
---

MLForm primitives render labels, descriptions, errors, disabled state, and read-only state from
runtime state and view descriptors. Keyboard focus highlights the active control. Errors include
text and a field outline; success uses text and a check mark as well as color.

Numeric text editors preserve the typed text and selection, expose spinbutton semantics and support
arrow-key stepping. Read-only text and numeric values remain focusable for selection and copying,
with a muted appearance and no editing caret. Disabled controls are not editable or tabbable.

`mounted.submit()` reveals the first invalid field, opens its containing tab, wizard step, or
accordion section when needed, and focuses the control. A custom headless renderer must implement
its own focus behavior. Description and feedback transitions respect reduced motion, and the
built-in controls retain focus and state cues in forced-colors mode.

Checklist:

| Area               | Requirement                                                |
| ------------------ | ---------------------------------------------------------- |
| Labels             | Every field must have a meaningful `label`.                |
| Descriptions       | Use `description` for constraints users need before input. |
| Errors             | Prefer actionable messages from validators.                |
| Keyboard           | Do not trap focus around the mounted host.                 |
| Disabled/read-only | Use schema flags so semantics reach primitives.            |
| Color              | Do not rely on color alone in host overrides.              |

Host applications remain responsible for page landmarks, surrounding headings, and route-level focus management.
