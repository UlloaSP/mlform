---
title: FastAPI
description: Endpoint FastAPI con Pydantic y respuesta de reports.
---

```py
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()

class PredictRequest(BaseModel):
    values: dict = Field(alias="inputs")

@app.post("/api/predict")
def predict(payload: PredictRequest):
    return {
        "reports": {
            "prediction": {
                "label": "Approved",
                "confidence": 0.91,
            }
        }
    }
```

Configura CORS si el frontend y el backend viven en orígenes distintos.
