---
title: Errores De Layout
description: Errores comunes al validar layouts explicitos.
---

- `Field "name" appears multiple times in layout.`
- `Field "email" is missing from layout.`
- `Layout references unknown field "foo".`
- `Wizard layout must define at least one step.`
- `Wizard step "profile" must contain at least one layout node.`
- `Tabs layout must define at least one tab.`
- `Tab "profile" must contain at least one layout node.`
- `Accordion layout must define at least one section.`
- `Accordion section "profile" must contain at least one layout node.`
- `goToStep() is only available for wizard layouts.`
- `setActiveTab() is only available for tabs layouts.`
- `Accordion section controls are only available for accordion layouts.`

Checklist:

1. confirma ids finales del schema
2. confirma cobertura completa de fields
3. confirma que reports usan ids existentes
