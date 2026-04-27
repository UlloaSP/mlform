---
title: FastAPI
description: Implement a Python backend for MLForm.
---

```py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    values: dict = Field(alias="inputs")

@app.post("/api/predict")
def predict(request: PredictRequest):
    prompt = request.values.get("prompt")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required.")

    return {
        "reports": {
            "prediction": {"label": "approved", "confidence": 0.91}
        }
    }
```

Expose backend validation as an HTTP error. For a custom message, return a JSON body with `message`.
