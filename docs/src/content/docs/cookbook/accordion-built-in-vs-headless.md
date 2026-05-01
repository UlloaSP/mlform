---
title: Accordion Built-in vs Headless
description: Decide when to use mountAccordionForm directly and when to render your own accordion host on top of createFormView.
---

Choose `mountAccordionForm()` when you want:

- built-in disclosure UI
- a persistent submit footer
- minimal host code

Choose `createFormView()` when you want:

- app-owned accordion visuals
- custom summary badges or analytics panels
- different disclosure behavior on desktop and mobile
