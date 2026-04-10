---
title: Troubleshooting
description: Problemas comunes de integración y soluciones.
---

| Problema                         | Causa probable                        | Solución                                 |
| -------------------------------- | ------------------------------------- | ---------------------------------------- |
| Container ausente                | `querySelector` devolvió `null`.      | Monta después de que exista el elemento. |
| Falta endpoint o transport       | No hay ruta de submit.                | Pasa `endpoint` o `transport`.           |
| Config de transport en conflicto | Se mezcló `transport` con `endpoint`. | Usa una estrategia.                      |
| Backend no devuelve JSON         | El parser por defecto espera JSON.    | Devuelve JSON o usa `parse`.             |
| Field kind desconocido           | Falta registry.                       | Usa built-ins o registra campo propio.   |
| Report kind desconocido          | Falta registry.                       | Usa built-ins o registra informe propio. |
| Id duplicado                     | Dos items comparten id.               | Usa ids únicos.                          |
| Custom element inválido          | El tag no tiene guion.                | Usa nombres como `risk-band-field`.      |
| Estilos no heredados             | El sistema de diseño no hereda modo.  | Usa `mode: "inherit"` o tokens.          |
