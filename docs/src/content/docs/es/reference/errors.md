---
title: Errores
description: Clases de error de MLForm.
---

| Error                    | Import path     | Cuándo aparece                          |
| ------------------------ | --------------- | --------------------------------------- |
| `EngineError`            | `mlform/engine` | Base de errores del engine.             |
| `RegistryError`          | `mlform/engine` | Registro duplicado o contrato inválido. |
| `ValidationError`        | `mlform/engine` | `submit()` bloqueado por validación.    |
| `SubmitError`            | `mlform/engine` | Transporte o parse falló.               |
| `SubmissionAbortedError` | `mlform/engine` | Submit cancelado.                       |
