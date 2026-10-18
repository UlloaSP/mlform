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
        "reports": [
            {
                "backend": "default",
                "mappedTo": "prediction",
                "status": "ready",
                "payload": {"prediction": "approved", "probabilities": [0.91, 0.09]},
            }
        ]
    }
```

Expose backend validation as an HTTP error. FastAPI's `HTTPException` uses a `detail` property;
parse it in the application transport when the UI should show that message. MLForm does not
parse HTTP error bodies itself.
