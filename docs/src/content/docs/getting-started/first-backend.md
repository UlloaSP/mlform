---
title: First Backend
description: Implement the smallest backend contract MLForm needs.
---

The default kit transport sends a JSON request with serialized field values under `inputs`.

```json
{
  "inputs": {
    "prompt": "Example text",
    "threshold": 0.75
  }
}
```

Return a `reports` array of explicit envelopes. `meta` is optional and can carry request ids, model version, timing, or audit information.

```json
{
  "reports": [
    {
      "backend": "default",
      "mappedTo": "prediction",
      "status": "ready",
      "payload": {
        "prediction": "Approved",
        "probabilities": [0.91, 0.09]
      }
    }
  ],
  "meta": {
    "model": "credit-risk-v2"
  }
}
```

## Express

```ts
import express from "express";

const app = express();
app.use(express.json());

app.post("/api/predict", (req, res) => {
  const { prompt, threshold } = req.body.inputs ?? {};

  if (!prompt) {
    res.status(400).json({ message: "Prompt is required." });
    return;
  }

  res.json({
    reports: [
      {
        backend: "default",
        mappedTo: "prediction",
        status: "ready",
        payload: {
          prediction: "Approved",
          probabilities: [Number(threshold ?? 0.75), 1 - Number(threshold ?? 0.75)],
        },
      },
    ],
    meta: { model: "demo" },
  });
});
```

## FastAPI

```py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()

class PredictRequest(BaseModel):
    values: dict = Field(alias="inputs")

@app.post("/api/predict")
def predict(request: PredictRequest):
    prompt = request.values.get("prompt")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required.")

    return {
        "reports": [
            {
                "backend": "default",
                "mappedTo": "prediction",
                "status": "ready",
                "payload": {
                    "prediction": "Approved",
                    "probabilities": [request.values.get("threshold", 0.75), 1 - request.values.get("threshold", 0.75)],
                },
            }
        ],
        "meta": {"model": "demo"},
    }
```

For non-2xx responses, `createJsonTransport` reads the response body and uses a `message` property when present.
