---
title: Errores
description: Clases de error de MLForm.
---

| Error                    | Import path      | Cuándo aparece                          |
| ------------------------ | ---------------- | --------------------------------------- |
| `EngineError`            | `mlform/runtime` | Base de errores del engine.             |
| `RegistryError`          | `mlform/runtime` | Registro duplicado o contrato inválido. |
| `ValidationError`        | `mlform/runtime` | `submit()` bloqueado por validación.    |
| `SubmitError`            | `mlform/runtime` | Transporte o parse falló.               |
| `SubmissionAbortedError` | `mlform/runtime` | Submit cancelado.                       |
