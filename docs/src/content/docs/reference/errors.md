---
title: Errors
description: Error classes thrown by MLForm engine and kit operations.
---

| Error                    | Import path     | When it appears                                            |
| ------------------------ | --------------- | ---------------------------------------------------------- |
| `EngineError`            | `mlform/engine` | Base class for engine failures.                            |
| `RegistryError`          | `mlform/engine` | Duplicate registration or missing registry contract.       |
| `ValidationError`        | `mlform/engine` | `submit()` was blocked by validation. Includes `result`.   |
| `SubmitError`            | `mlform/engine` | Transport or response processing failed. Includes `cause`. |
| `SubmissionAbortedError` | `mlform/engine` | Pending submit was aborted.                                |

```ts
try {
  await mounted.form.submit();
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.result.fields);
  }
}
```

Related: [Error Handling](/mlform/guides/error-handling/).
