---
title: Versionado
description: Cómo la documentación sigue las versiones de MLForm.
---

La linea de release actual en este repositorio es `0.1.4`.

La documentación publicada sigue la rama principal mantenida salvo que una nota de release indique otra cosa. En la práctica, eso significa que la documentación debería describir la release actual de npm después de cada publicación etiquetada, aunque puede adelantarse brevemente entre merges y el siguiente corte de release.

Para `0.1.4`, la intención es:

- que los ejemplos del README coincidan con la API pública publicada
- que las guías de inicio usen `mountForm`, `fields`, `reports`, `kind` y `label`
- que la instalación refleje el flujo de trabajo actual con Vite+ en este repositorio
- que la API legacy aparezca solo en la guía de migración y no en la ruta principal

Notas:

- los ejemplos actuales usan `mountForm`, `fields`, `reports`, `kind` y `label`
- la API legacy solo aparece en la guía de migración
- no hay redirecciones para la estructura antigua
- la referencia es manual; TypeDoc no forma parte de esta migración

Para detalles de versión, consulta:

- npm: `mlform`
- GitHub Releases: `UlloaSP/mlform`
