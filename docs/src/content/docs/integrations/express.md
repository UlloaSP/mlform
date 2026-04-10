---
title: Express
description: Implement a Node.js backend for MLForm.
---

```ts
import express from "express";

const app = express();
app.use(express.json());

app.post("/api/predict", (req, res) => {
  const inputs = req.body.inputs ?? {};

  if (!inputs.prompt) {
    res.status(400).json({ message: "Prompt is required." });
    return;
  }

  res.json({
    reports: {
      prediction: { label: "approved", confidence: 0.91 },
    },
  });
});
```

The default transport sends `Content-Type: application/json` and `Accept: application/json`.
