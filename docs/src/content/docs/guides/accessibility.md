---
title: Accessibility
description: Build MLForm integrations that remain usable with keyboard and assistive technology.
---

MLForm primitives render labels, descriptions, errors, disabled state, and read-only state from the engine descriptors.

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
