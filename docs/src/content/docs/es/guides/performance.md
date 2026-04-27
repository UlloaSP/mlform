---
title: Performance
description: Evita remounts innecesarios, validaciones costosas y payloads grandes.
---

Buenas prácticas:

- no remountes el formulario en cada render del framework
- mantén schemas estables cuando sea posible
- desmonta en cambios de vista o rutas
- debouncea validación async
- limita series temporales grandes o usa paginación externa
- usa `subscribeSelector` para previews en vez de suscribirte a todo el estado

Si el modelo tarda mucho, respeta `AbortSignal` en transports personalizados para que `unmount()` pueda cancelar trabajo pendiente.
