---
title: Layout Wizard
description: Usa el wizard oficial integrado o el mismo config mediante createFormView.
---

`mountWizardForm()` monta la UI oficial tipo wizard.

Caracteristicas:

- valida solo el step actual al avanzar
- permite volver sin validar
- submit final usa el engine normal

Usa `createFormView()` si necesitas un wizard visualmente custom pero quieres conservar el mismo contrato de layout.
