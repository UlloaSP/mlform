---
title: Custom Wizard From Headless Kit
description: Build your own wizard UI while keeping MLForm state, validation, and submission logic.
---

Use this pattern when:

- built-in wizard visuals are not enough
- navigation must match an existing product shell
- steps need app-specific chrome

```ts
const view = createFormView({
  transport,
  schema,
  layout: {
    kind: "wizard",
    steps: [
      { title: "Profile", children: [{ kind: "field", field: "name" }] },
      { title: "Review", children: [{ kind: "field", field: "email" }] },
    ],
  },
});

view.subscribe((snapshot) => render(snapshot));
```

Host actions:

- previous button -> `view.prevStep()`
- next button -> `await view.nextStep()`
- final submit -> `await view.submit()`

Keep the layout config the same if you later switch to `mountForm()`.
