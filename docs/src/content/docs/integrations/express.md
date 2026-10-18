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
    reports: [
      {
        backend: "default",
        mappedTo: "prediction",
        status: "ready",
        payload: { prediction: "approved", probabilities: [0.91, 0.09] },
      },
    ],
  });
});
```

The application transport must send JSON with `Content-Type: application/json`. The
[Quick Start](/getting-started/quick-start/) shows the matching request and response adapter.
