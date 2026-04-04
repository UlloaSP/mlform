---
sidebar_position: 3
---

# Model Types

MLForm supports machine learning model integration through two model types.

## Available Model Types

```typescript
enum ModelTypes {
  CLASSIFIER = 'classifier',
  REGRESSOR = 'regressor'
}
```

## Classifier

For classification problems - predicting discrete categories or classes.

### Schema

```typescript
{
  type: 'classifier',
  title?: string,
  execution_time?: number,
  mapping?: string[],
  probabilities?: number[][],
  details?: boolean
}
```

### Example

```typescript
{
  outputs: [
    {
      type: 'classifier',
      title: 'Risk Category',
      mapping: ['Low Risk', 'Medium Risk', 'High Risk'],
      probabilities: [[0.1, 0.5, 0.4]],
      details: true
    }
  ]
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | - | Optional display title (1-100 chars) |
| `execution_time` | `number` | - | Optional inference time in milliseconds (>= 0) |
| `mapping` | `string[]` | - | Optional label mappings for predictions |
| `probabilities` | `number[][]` | - | Optional probability matrix (values 0.0-1.0) |
| `details` | `boolean` | `false` | Show detailed information in UI |

### Use Cases

- **Binary Classification**: Yes/No, True/False, Pass/Fail
- **Multi-class Classification**: Categories, labels, types
- **Sentiment Analysis**: Positive/Negative/Neutral
- **Image Classification**: Object detection, face recognition
- **Spam Detection**: Spam/Not Spam

### Response Structure

Your backend should respond with this structure:

```json
{
  "outputs": [
    {
      "type": "classifier",
      "prediction": "high_risk",
      "confidence": 0.87,
      "probabilities": {
        "low_risk": 0.05,
        "medium_risk": 0.08,
        "high_risk": 0.87
      },
      "execution_time": 45
    }
  ]
}
```

**Response properties:**
- `prediction` (`string | number`) - The predicted class/label
- `confidence` (`number`, 0-1, optional) - Confidence score
- `probabilities` (`Record<string, number>`, optional) - Probability for each class
- `execution_time` (`number`, optional) - Inference time in milliseconds

### Complete Example

```typescript
const schema = {
  inputs: [
    {
      type: 'text',
      title: 'Email Content',
      required: true
    },
    {
      type: 'text',
      title: 'Subject Line',
      required: true
    }
  ],
  outputs: [
    {
      type: 'classifier',
      title: 'Spam Detection',
      mapping: ['Not Spam', 'Spam'],
      probabilities: [[0.95, 0.05]],
      details: false
    }
  ]
};

mlForm.onSubmit((inputs, response) => {
  const result = response.outputs?.[0];
  if (result) {
    console.log('Classification:', result.prediction);     // 'spam' or 'not_spam'
    console.log('Confidence:', result.confidence);          // 0.95
    console.log('Time:', result.execution_time);            // 45ms
  }
});
```

---

## Regressor

For regression problems - predicting continuous numerical values.

### Schema

```typescript
{
  type: 'regressor',
  title?: string,
  execution_time?: number,
  values?: number[],
  unit?: string,
  interval?: [number, number]
}
```

### Example

```typescript
{
  outputs: [
    {
      type: 'regressor',
      title: 'Predicted Price (USD)',
      unit: 'USD',
      interval: [420000, 480000]
    }
  ]
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | - | Optional display title (1-100 chars) |
| `execution_time` | `number` | - | Optional inference time in milliseconds (>= 0) |
| `values` | `number[]` | - | Optional historical/related values |
| `unit` | `string` | - | Optional unit label (e.g., 'USD', 'kg', 'm') |
| `interval` | `[number, number]` | - | Optional confidence interval [min, max] |

### Use Cases

- **Price Prediction**: Real estate, stocks, products
- **Demand Forecasting**: Sales, inventory, traffic
- **Risk Assessment**: Credit scores, insurance premiums
- **Time Series**: Weather, energy consumption
- **Performance Metrics**: Ratings, scores, measurements

### Response Structure

Your backend should respond with this structure:

```json
{
  "outputs": [
    {
      "type": "regressor",
      "prediction": 450000,
      "confidence_interval": [420000, 480000],
      "std_deviation": 15000,
      "execution_time": 67
    }
  ]
}
```

**Response properties:**
- `prediction` (`number`) - The predicted value
- `confidence_interval` (`[number, number]`, optional) - Lower and upper bounds
- `std_deviation` (`number`, optional) - Standard deviation of the prediction
- `execution_time` (`number`, optional) - Inference time in milliseconds

### Complete Example

```typescript
const schema = {
  inputs: [
    {
      type: 'number',
      title: 'House Size (sqft)',
      min: 0,
      required: true
    },
    {
      type: 'number',
      title: 'Number of Bedrooms',
      min: 1,
      max: 10,
      required: true
    },
    {
      type: 'category',
      title: 'Location',
      options: ['Urban', 'Suburban', 'Rural'],
      required: true
    },
    {
      type: 'number',
      title: 'Year Built',
      min: 1900,
      max: 2024,
      required: true
    }
  ],
  outputs: [
    {
      type: 'regressor',
      title: 'Predicted Price (USD)',
      unit: 'USD'
    }
  ]
};

mlForm.onSubmit((inputs, response) => {
  const result = response.outputs?.[0];
  if (result) {
    console.log('Predicted Price:', result.prediction);           // 450000
    console.log('Confidence Interval:', result.confidence_interval); // [420000, 480000]
    console.log('Std Dev:', result.std_deviation);               // 15000
    console.log('Time:', result.execution_time);                 // 67ms
  }
});
```

---

## Common Properties

Both model types share a base structure:

### BaseModel

```typescript
interface BaseModel {
  title?: string;           // Optional display title
  execution_time?: number;  // Inference time in milliseconds
}
```

---

## Backend Integration

### Expected API Request

MLForm sends a **POST request** to your backend URL (configured in the MLForm constructor) with this structure:

```json
{
  "inputs": {
    "Annual Income": 75000,
    "Credit Score": 720,
    "Employment Type": "Full-time"
  }
}
```

**Key points:**
- Field titles become keys in the `inputs` object
- Values preserve their types (string, number, boolean)
- Only the `inputs` object is sent (no model_type information)

### Expected API Response

MLForm expects the response in this format:

```json
{
  "outputs": [
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
  ]
}
```

**Important:**
- The response must have an `outputs` array
- Each output must include `type` and `prediction` fields
- Optional fields: `confidence`, `probabilities`, `execution_time`
- Multiple outputs are supported (for multiple models)

---

## Multiple Models

You can use multiple models in one form to display different predictions:

```typescript
const schema = {
  inputs: [
    {
      type: 'number',
      title: 'Income',
      required: true
    },
    {
      type: 'number',
      title: 'Credit Score',
      required: true
    }
  ],
  outputs: [
    {
      type: 'classifier',
      title: 'Approval Status',
      mapping: ['Rejected', 'Pending Review', 'Approved']
    },
    {
      type: 'regressor',
      title: 'Recommended Loan Amount (USD)',
      unit: 'USD'
    }
  ]
};

mlForm.onSubmit((inputs, response) => {
  // Access all predictions
  response.outputs?.forEach((output, index) => {
    console.log(`Prediction ${index}:`, output.prediction);
  });
});
```

### Expected Backend Response

```json
{
  "outputs": [
    {
      "type": "classifier",
      "prediction": "approved",
      "confidence": 0.92,
      "execution_time": 45
    },
    {
      "type": "regressor",
      "prediction": 250000,
      "confidence_interval": [200000, 300000],
      "execution_time": 38
    }
  ]
}
```

---

## Type Import

```typescript
import { ModelTypes } from 'mlform/strategies';

console.log(ModelTypes.CLASSIFIER); // 'classifier'
console.log(ModelTypes.REGRESSOR);  // 'regressor'
```

---

## Error Handling

### Backend Error Responses

Handle prediction errors gracefully:

```typescript
mlForm.onSubmit((inputs, response) => {
  // Check if response has outputs
  if (!response.outputs || response.outputs.length === 0) {
    console.error('No predictions available');
    showErrorMessage('Unable to generate prediction');
    return;
  }
  
  // Check for prediction errors
  const prediction = response.outputs[0];
  if (!prediction.prediction) {
    console.error('Invalid prediction format');
    showErrorMessage('Prediction format error');
    return;
  }
  
  // Process successful prediction
  displayPrediction(prediction);
});
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Missing `outputs` field | Backend response format error | Ensure response includes `outputs` array |
| Empty `outputs` array | Backend didn't process request | Check backend logs |
| Missing `prediction` field | Incomplete output object | Include `prediction` in all outputs |
| Type mismatch (classifier/regressor) | Wrong output type specified | Verify `type` matches schema |
| Invalid confidence value | Confidence outside 0-1 range | Ensure confidence is between 0 and 1 |

### Network Error Handling

```typescript
mlForm.onSubmit(async (inputs, response) => {
  try {
    // Response handling
    if (!response.outputs) {
      throw new Error('No outputs in response');
    }
    
    console.log('Success:', response.outputs[0].prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    // Show user-friendly error message
    displayErrorUI('Prediction service unavailable. Please try again.');
  }
});
```

---

## See Also

- [MLForm Class](./mlform)
- [Field Types](./field-types)
- [Examples](../examples/ml-classification)
