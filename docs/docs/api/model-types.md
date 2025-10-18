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
  execution_time?: number
}
```

### Example

```typescript
{
  outputs: [
    {
      type: 'classifier',
      title: 'Risk Category'
    }
  ]
}
```

### Use Cases

- **Binary Classification**: Yes/No, True/False, Pass/Fail
- **Multi-class Classification**: Categories, labels, types
- **Sentiment Analysis**: Positive/Negative/Neutral
- **Image Classification**: Object detection, face recognition
- **Spam Detection**: Spam/Not Spam

### Response Structure

```typescript
interface ClassifierOutput {
  type: 'classifier';
  prediction: string | number;    // Predicted class
  confidence?: number;             // Confidence score (0-1)
  probabilities?: Record<string, number>; // Class probabilities
  execution_time?: number;         // Inference time in ms
  title?: string;
}
```

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
      title: 'Spam Detection'
    }
  ]
};

mlForm.onSubmit((inputs, response) => {
  console.log('Classification:', response.prediction); // 'spam' or 'not_spam'
  console.log('Confidence:', response.confidence);      // 0.95
  console.log('Time:', response.execution_time);        // 45ms
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
  execution_time?: number
}
```

### Example

```typescript
{
  outputs: [
    {
      type: 'regressor',
      title: 'Predicted Price'
    }
  ]
}
```

### Use Cases

- **Price Prediction**: Real estate, stocks, products
- **Demand Forecasting**: Sales, inventory, traffic
- **Risk Assessment**: Credit scores, insurance premiums
- **Time Series**: Weather, energy consumption
- **Performance Metrics**: Ratings, scores, measurements

### Response Structure

```typescript
interface RegressorOutput {
  type: 'regressor';
  prediction: number;              // Predicted value
  confidence_interval?: [number, number]; // Lower/upper bounds
  std_deviation?: number;          // Standard deviation
  execution_time?: number;         // Inference time in ms
  title?: string;
}
```

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
      title: 'Predicted Price (USD)'
    }
  ]
};

mlForm.onSubmit((inputs, response) => {
  console.log('Predicted Price:', response.prediction); // 450000
  console.log('Confidence Interval:', response.confidence_interval); // [420000, 480000]
  console.log('Time:', response.execution_time); // 67ms
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

MLForm sends a POST request to your backend with the following structure:

```json
{
  "inputs": {
    "field_name_1": "value1",
    "field_name_2": 42,
    "field_name_3": true
  },
  "model_type": "classifier" // or "regressor"
}
```

### Expected API Response

#### Classifier Response

```json
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
```

#### Regressor Response

```json
{
  "type": "regressor",
  "prediction": 450000,
  "confidence_interval": [420000, 480000],
  "std_deviation": 15000,
  "execution_time": 67
}
```

---

## Multiple Models

You can use multiple models in one form:

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
      title: 'Approval Status'
    },
    {
      type: 'regressor',
      title: 'Loan Amount'
    }
  ]
};
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

Handle prediction errors gracefully:

```typescript
mlForm.onSubmit((inputs, response) => {
  if (response.error) {
    console.error('Prediction failed:', response.error);
    showErrorMessage('Unable to generate prediction');
    return;
  }
  
  // Process successful prediction
  displayPrediction(response.prediction);
});
```

---

## See Also

- [MLForm Class](./mlform)
- [Field Types](./field-types)
- [Examples](../examples/ml-classification)
