---
title: Lifecycle
description: Que cambia mientras un formulario montado esta vivo.
---

Un MLForm montado pasa por este flujo:

1. Schema se normaliza.
2. Se crea estado de campos.
3. Layout se resuelve.
4. Campos cambian mientras el usuario escribe.
5. Condiciones cambian hidden, disabled o read-only.
6. Corre validacion.
7. Submit serializa valores activos.
8. Transport devuelve reports o errores.
9. Estado de reports se actualiza.
10. `unmount()` quita listeners y DOM propiedad de MLForm.

Hooks permiten observar este flujo sin tomar posesion. Sirven para analytics, efectos secundarios, mapear errores de servidor y coordinar cleanup.

Los errores pertenecen a la etapa que los produjo:

| Etapa | Ejemplo |
| --- | --- |
| setup schema/layout | field id duplicado, referencia de layout inexistente |
| validacion de campo | required, rango, custom validator |
| submit | abort, fallo de transport, limite de payload |
| report fetch | report async falla despues del submit |

Mantén el trabajo de lifecycle cerca de la capa que lo posee. Comportamiento de campos va cerca de schema/runtime. Recuperacion visual va cerca de kit o la UI host. Politica de red va en transport.
