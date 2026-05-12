---
title: Vue Headless Layout
description: Drive a Vue layout from FormViewSnapshot updates.
---

Recommended pattern:

- store `view` outside reactive deep cloning
- store `snapshot` in a shallow ref
- subscribe on component mount
- render from `snapshot.layout`

The same DSL works across Vue, React, Lit, and vanilla hosts because it is framework-agnostic.
