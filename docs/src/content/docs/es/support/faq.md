---
title: FAQ
description: Respuestas cortas a preguntas frecuentes.
---

## ¿Puedo usar MLForm sin React?

Sí. MLForm monta Web Components en un `HTMLElement`.

## ¿Funciona con React, Vue, Angular o Astro?

Sí. Monta en el lifecycle del framework y llama `mounted.unmount()` al limpiar.

## ¿Puedo ejecutar modelos locales?

Sí. Pasa un `transport` personalizado que devuelva `{ reports, meta }`.

## ¿Pueden venir los schemas desde backend?

Sí, si usan configuración serializable. Las condiciones función no son JSON serializables.

## ¿Cómo personalizo la apariencia?

Usa `designSystem` con themes y recipes integrados, o define themes, recipes y tokens propios.
