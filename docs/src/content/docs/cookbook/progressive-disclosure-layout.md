---
title: Progressive Disclosure Layout
description: Combine layout structure with field visibility conditions for staged experiences.
---

Layout controls layout structure. Conditions still control actual field visibility.

Use progressive disclosure when:

- later fields should exist in the same step but appear only after earlier answers
- the step itself is stable, but the content inside it changes

Guideline:

- use `wizard` or `section` to control navigation
- use field conditions to control visibility inside each node

Remember:

- `field.state.visible` comes from conditions
- `visibleInLayout` comes from the active step
