---
title: Instalacion
description: Instala MLForm y prepara el workspace de documentacion.
---

Instala el paquete runtime en una aplicacion:

```bash
npm install mlform
```

Si quieres instalar exactamente la version documentada aqui, fija `0.1.13`:

```bash
npm install mlform@0.1.13
```

Para este repositorio, usa Vite+:

```bash
vp install
vp check
vp test
vp build
```

El paquete declara Node.js `>=24.9.0` para desarrollo local y CI. El sitio de documentacion es una app Astro Starlight dentro de `docs/`:

```bash
cd docs
vp install
vp run typecheck
vp run build
vp run dev
```
