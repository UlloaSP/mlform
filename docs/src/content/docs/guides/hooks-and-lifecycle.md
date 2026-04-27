---
title: Hooks And Lifecycle
description: Observe validation, submission, errors, aborts, and cleanup.
---

Hooks run around validation and submit:

```ts
hooks: {
  beforeValidate({ values, submitCount }) {},
  afterValidate({ result }) {},
  beforeSubmit({ serializedValues, signal }) {},
  afterSubmit({ result }) {},
  onSubmitError({ error }) {},
}
```

Lifecycle rules:

| Situation                                         | Behavior                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| Mounting into a container that already has MLForm | The previous mounted form is unmounted first.                     |
| Calling `mounted.unmount()`                       | Pending submit is aborted and design system observers disconnect. |
| Calling `mounted.form.reset()`                    | Values and report state return to initial state.                  |
| Calling `mounted.form.abortSubmit(reason)`        | In-flight submit receives an abort signal.                        |

Use hooks for analytics, logging, custom loading state, and backend tracing. Do not mutate DOM from hooks unless you own the host integration.
