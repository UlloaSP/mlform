---
title: Express
description: Endpoint Express con JSON middleware y errores útiles.
---

```ts
import express from "express";

const app = express();
app.use(express.json());

app.post("/api/predict", (request, response) => {
  const values = request.body["inputs"];

  if (!values.prompt) {
    response.status(400).json({ message: "Prompt is required." });
    return;
  }

  response.json({
    reports: {
      prediction: { label: "Approved", confidence: 0.91 },
    },
  });
});
```
