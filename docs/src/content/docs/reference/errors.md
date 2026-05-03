---
title: Errors
description: Error classes thrown by MLForm engine and kit operations.
---

| Error                    | Import path      | When it appears                                            |
| ------------------------ | ---------------- | ---------------------------------------------------------- |
| `EngineError`            | `mlform/runtime` | Base class for engine failures.                            |
| `RegistryError`          | `mlform/runtime` | Duplicate registration or missing registry contract.       |
| `ValidationError`        | `mlform/runtime` | `submit()` was blocked by validation. Includes `result`.   |
| `SubmitError`            | `mlform/runtime` | Transport or response processing failed. Includes `cause`. |
| `SubmissionAbortedError` | `mlform/runtime` | Pending submit was aborted.                                |

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
