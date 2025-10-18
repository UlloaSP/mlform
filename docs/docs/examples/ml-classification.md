---
sidebar_position: 2
---

# ML Classification

Build a form with classification model integration.

## Overview

This example demonstrates:
- Creating a form with ML classification
- Real-time predictions
- Displaying confidence scores
- Handling prediction results

## Use Case

Credit risk assessment form that predicts loan approval likelihood.

## Complete Code

```typescript
import { MLForm } from 'mlform';

// Initialize with your ML backend
const mlForm = new MLForm('https://api.example.com/predict/credit-risk');

// Define schema with classifier
const schema = {
  inputs: [
    {
      type: 'number',
      title: 'Annual Income',
      description: 'Total yearly income in USD',
      min: 0,
      required: true
    },
    {
      type: 'number',
      title: 'Credit Score',
      description: 'FICO score (300-850)',
      min: 300,
      max: 850,
      required: true
    },
    {
      type: 'number',
      title: 'Years Employed',
      description: 'Years at current job',
      min: 0,
      max: 50,
      required: true
    },
    {
      type: 'number',
      title: 'Existing Debt',
      description: 'Total current debt in USD',
      min: 0,
      required: true
    },
    {
      type: 'category',
      title: 'Employment Type',
      options: ['Full-time', 'Part-time', 'Self-employed', 'Unemployed'],
      required: true
    },
    {
      type: 'category',
      title: 'Home Ownership',
      options: ['Own', 'Rent', 'Mortgage'],
      required: true
    }
  ],
  outputs: [
    {
      type: 'classifier',
      title: 'Loan Approval Prediction'
    }
  ]
};

// Handle predictions
mlForm.onSubmit((inputs, response) => {
  console.log('Input values:', inputs);
  console.log('Prediction:', response);
  
  // Display results
  displayResults(inputs, response);
});

function displayResults(inputs, response) {
  const resultsDiv = document.getElementById('results');
  
  // Get prediction details
  const prediction = response.prediction;
  const confidence = (response.confidence * 100).toFixed(1);
  const executionTime = response.execution_time;
  
  // Format result message
  let statusClass = '';
  let statusMessage = '';
  
  if (prediction === 'approved') {
    statusClass = 'success';
    statusMessage = '✅ Likely to be Approved';
  } else if (prediction === 'review') {
    statusClass = 'warning';
    statusMessage = '⚠️ Requires Manual Review';
  } else {
    statusClass = 'danger';
    statusMessage = '❌ Likely to be Rejected';
  }
  
  // Update UI
  resultsDiv.innerHTML = `
    <div class="result-card ${statusClass}">
      <h3>${statusMessage}</h3>
      <div class="confidence">
        Confidence: <strong>${confidence}%</strong>
      </div>
      <div class="execution-time">
        Processed in ${executionTime}ms
      </div>
      
      <h4>Application Summary</h4>
      <ul>
        <li>Income: $${inputs['Annual Income'].toLocaleString()}</li>
        <li>Credit Score: ${inputs['Credit Score']}</li>
        <li>Years Employed: ${inputs['Years Employed']}</li>
        <li>Existing Debt: $${inputs['Existing Debt'].toLocaleString()}</li>
        <li>Employment: ${inputs['Employment Type']}</li>
        <li>Housing: ${inputs['Home Ownership']}</li>
      </ul>
      
      ${response.probabilities ? `
        <h4>Probability Breakdown</h4>
        <div class="probabilities">
          ${Object.entries(response.probabilities)
            .map(([key, val]) => `
              <div class="prob-item">
                <span>${key}:</span>
                <span class="prob-bar">
                  <span style="width: ${val * 100}%"></span>
                </span>
                <span>${(val * 100).toFixed(1)}%</span>
              </div>
            `)
            .join('')}
        </div>
      ` : ''}
    </div>
  `;
  
  resultsDiv.style.display = 'block';
}

// Initialize
async function initialize() {
  const container = document.getElementById('form-container');
  await mlForm.toHTMLElement(schema, container);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
```

## HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credit Risk Assessment - MLForm</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    
    h1 {
      color: #2c3e50;
    }
    
    .container {
      display: grid;
      gap: 2rem;
      grid-template-columns: 1fr 1fr;
    }
    
    @media (max-width: 768px) {
      .container {
        grid-template-columns: 1fr;
      }
    }
    
    #form-container, #results {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    #results {
      display: none;
    }
    
    .result-card {
      padding: 1.5rem;
      border-radius: 8px;
      border: 2px solid;
    }
    
    .result-card.success {
      background: #d4edda;
      border-color: #28a745;
      color: #155724;
    }
    
    .result-card.warning {
      background: #fff3cd;
      border-color: #ffc107;
      color: #856404;
    }
    
    .result-card.danger {
      background: #f8d7da;
      border-color: #dc3545;
      color: #721c24;
    }
    
    .confidence, .execution-time {
      margin: 0.5rem 0;
      font-size: 0.9rem;
    }
    
    .probabilities {
      margin-top: 1rem;
    }
    
    .prob-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0.5rem 0;
    }
    
    .prob-bar {
      flex: 1;
      height: 20px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .prob-bar span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #007bff, #0056b3);
      transition: width 0.3s;
    }
  </style>
</head>
<body>
  <h1>Credit Risk Assessment</h1>
  <p>Enter applicant information to predict loan approval likelihood</p>
  
  <div class="container">
    <div id="form-container"></div>
    <div id="results"></div>
  </div>
  
  <script type="module" src="./app.js"></script>
</body>
</html>
```

## Backend API

Your backend should handle the request:

### Request Format

```json
{
  "inputs": {
    "Annual Income": 75000,
    "Credit Score": 720,
    "Years Employed": 5,
    "Existing Debt": 15000,
    "Employment Type": "Full-time",
    "Home Ownership": "Mortgage"
  },
  "model_type": "classifier"
}
```

### Response Format

```json
{
  "type": "classifier",
  "prediction": "approved",
  "confidence": 0.87,
  "probabilities": {
    "approved": 0.87,
    "review": 0.10,
    "rejected": 0.03
  },
  "execution_time": 45
}
```

## Example Backend (Python/FastAPI)

```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import time

app = FastAPI()

# Load your trained model
model = joblib.load('credit_risk_model.pkl')

class PredictionRequest(BaseModel):
    inputs: dict
    model_type: str

@app.post("/predict/credit-risk")
async def predict_credit_risk(request: PredictionRequest):
    start_time = time.time()
    
    # Extract features
    features = [
        request.inputs['Annual Income'],
        request.inputs['Credit Score'],
        request.inputs['Years Employed'],
        request.inputs['Existing Debt'],
        # ... encode categorical variables
    ]
    
    # Make prediction
    prediction = model.predict([features])[0]
    probabilities = model.predict_proba([features])[0]
    
    execution_time = int((time.time() - start_time) * 1000)
    
    return {
        "type": "classifier",
        "prediction": prediction,
        "confidence": float(max(probabilities)),
        "probabilities": {
            "approved": float(probabilities[0]),
            "review": float(probabilities[1]),
            "rejected": float(probabilities[2])
        },
        "execution_time": execution_time
    }
```

## Key Features

### 1. Real-time Predictions

Predictions happen automatically on form submission.

### 2. Confidence Display

Shows model confidence to help users understand prediction certainty.

### 3. Probability Breakdown

Displays probabilities for all possible outcomes.

### 4. Execution Time Tracking

Shows how long the prediction took.

## Customization

### Change Prediction Classes

Modify the prediction handling:

```typescript
const classConfig = {
  'approved': { icon: '✅', color: 'success', message: 'Approved' },
  'review': { icon: '⚠️', color: 'warning', message: 'Review Needed' },
  'rejected': { icon: '❌', color: 'danger', message: 'Rejected' }
};

const config = classConfig[prediction];
```

### Add More Input Fields

```typescript
{
  type: 'number',
  title: 'Number of Dependents',
  min: 0,
  max: 10,
  required: true
}
```

## Next Steps

- 🔢 Try [regression predictions](./ml-regression)
- 📊 Add [data visualization](../guides/visualization)
- 🔒 Implement [error handling](../guides/error-handling)

## Related Examples

- [ML Regression](./ml-regression)
- [Multi-Model Form](./multi-model)
