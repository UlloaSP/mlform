---
title: Disclosure Built-in vs Headless
description: Decide when to use mountForm directly and when to render your own disclosure host on top of createFormView.
---

Choose `mountForm()` when you want:

- built-in disclosure UI
- a persistent submit footer
- minimal host code

Choose `createFormView()` when you want:

- app-owned disclosure visuals
- custom summary badges or analytics panels
- different disclosure behavior on desktop and mobile
