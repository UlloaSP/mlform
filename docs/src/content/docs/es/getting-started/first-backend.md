---
title: Primer backend
description: Endpoint mínimo para conectar MLForm con un modelo.
---

MLForm envía los valores serializados en una petición JSON. El contrato recomendado es:

```json
{
  "inputs": {
    "prompt": "Example text",
    "threshold": 0.75
  }
}
```

La respuesta recomendada usa `reports`, con claves que coinciden con los ids de informes.

```json
{
  "reports": {
    "prediction": {
      "label": "Approved",
      "confidence": 0.91
    }
  },
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

app.post("/api/predict", (request, response) => {
  const values = request.body["inputs"];

  response.json({
    reports: {
      prediction: {
        label: values.prompt.length > 10 ? "Approved" : "Review",
        confidence: 0.86,
      },
    },
    meta: { model: "demo" },
  });
});
```

## FastAPI

```py
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()

class PredictRequest(BaseModel):
    values: dict = Field(alias="inputs")

@app.post("/api/predict")
def predict(payload: PredictRequest):
    prompt = payload.values.get("prompt", "")
    return {
        "reports": {
            "prediction": {
                "label": "Approved" if len(prompt) > 10 else "Review",
                "confidence": 0.86,
            }
        },
        "meta": {"model": "demo"},
    }
```

Si el backend devuelve `Response.ok === false`, el transporte JSON lo trata como error de submit. Devuelve un JSON con `message` para que el error sea útil.
