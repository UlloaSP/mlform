---
title: Diseño de schemas
description: Buenas prácticas para ids, labels, defaults, ui y versionado.
---

Usa ids explícitos y estables. El `label` puede cambiar por idioma o producto, pero el `id` debería seguir siendo la clave contractual con backend, tests y analítica.

| Tema           | Recomendación                                                      |
| -------------- | ------------------------------------------------------------------ |
| `id`           | Usa snake_case o kebab-case de forma consistente.                  |
| `label`        | Escribe texto claro para usuarios, no nombres técnicos.            |
| `required`     | Úsalo para reglas simples; deja reglas complejas a validators.     |
| `defaultValue` | Reserva defaults de negocio para el schema.                        |
| `ui`           | Guarda hints específicos del renderer, no lógica de negocio.       |
| Versionado     | Incluye una versión externa si el backend sirve schemas dinámicos. |

Diseña schemas pequeños y componibles. Si un formulario empieza a mezclar demasiados casos, usa condiciones o varios schemas.
