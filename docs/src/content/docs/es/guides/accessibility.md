---
title: Accesibilidad
description: Labels, errores, teclado y responsabilidades del host.
---

MLForm genera labels, descripciones y errores para los primitives integrados. El host sigue siendo responsable de:

- montar el formulario en una región navegable
- no ocultar focus rings
- mantener contraste suficiente si sobrescribe tokens
- no bloquear navegación por teclado
- probar estados disabled y read-only

Checklist rápido:

| Revisión | Esperado                                        |
| -------- | ----------------------------------------------- |
| Tab      | Todos los controles activos son alcanzables.    |
| Labels   | Cada campo tiene label visible o accesible.     |
| Errores  | El error se anuncia junto al campo.             |
| Submit   | El botón indica estados de validación y submit. |
| Tema     | Claro y oscuro mantienen contraste.             |
