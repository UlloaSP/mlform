---
sidebar_position: 2
---

# Quick Start

Create your first dynamic form with MLForm in minutes.

## Basic Setup

Here's a minimal example to get you started:

```typescript
import { MLForm } from 'mlform';

// Create an MLForm instance with your backend URL
const mlForm = new MLForm('https://api.example.com/predict');

// Define your form schema
const schema = {
  inputs: [
    {
      type: 'text',
      title: 'Full Name',
      description: 'Enter your full name',
      required: true
    },
    {
      type: 'number',
      title: 'Age',
      description: 'Your age in years',
      min: 0,
      max: 120,
      required: true
    },
    {
      type: 'boolean',
      title: 'Subscribe to newsletter',
      required: false
    }
  ],
  outputs: []
};

// Get your container element
const container = document.getElementById('form-container');

// Render the form
await mlForm.toHTMLElement(schema, container);
```

## HTML Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MLForm Example</title>
</head>
<body>
  <div id="form-container"></div>
  
  <script type="module" src="./app.js"></script>
</body>
</html>
```

## With Machine Learning

Add ML model integration for predictions:

```typescript
import { MLForm } from 'mlform';

const mlForm = new MLForm('https://api.example.com/predict');

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
    }
  ],
  outputs: [
    {
      type: 'regressor',
      title: 'Predicted Price'
    }
  ]
};

// Listen for form submissions
mlForm.onSubmit((inputs, response) => {
  console.log('Form inputs:', inputs);
  console.log('Model prediction:', response);
});

// Render the form
const container = document.getElementById('form-container');
await mlForm.toHTMLElement(schema, container);
```

## Reactive Updates

Subscribe to form changes:

```typescript
// Subscribe to form submissions
const unsubscribe = mlForm.onSubmit((inputs, response) => {
  console.log('User inputs:', inputs);
  console.log('ML prediction:', response);
  
  // Update your UI
  updateResultsDisplay(response);
});

// Later, unsubscribe when needed
unsubscribe();
```

## Access Last Submission

Retrieve the last form submission synchronously:

```typescript
// Get the last inputs
const lastInputs = mlForm.lastInputs;
console.log('Last form inputs:', lastInputs);

// Get the last ML response
const lastResponse = mlForm.lastResponse;
console.log('Last prediction:', lastResponse);
```

## Complete Example

Here's a complete working example:

```typescript
import { MLForm } from 'mlform';

async function initializeForm() {
  // Create MLForm instance
  const mlForm = new MLForm('https://api.example.com/predict');
  
  // Define schema
  const schema = {
    inputs: [
      {
        type: 'text',
        title: 'Name',
        required: true
      },
      {
        type: 'number',
        title: 'Years of Experience',
        min: 0,
        max: 50,
        required: true
      },
      {
        type: 'category',
        title: 'Department',
        options: ['Engineering', 'Sales', 'Marketing', 'HR'],
        required: true
      }
    ],
    outputs: [
      {
        type: 'classifier',
        title: 'Salary Range Prediction'
      }
    ]
  };
  
  // Subscribe to submissions
  mlForm.onSubmit((inputs, response) => {
    console.log('Prediction:', response);
    
    // Display results
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
      <h3>Prediction Results</h3>
      <p>Name: ${inputs.Name}</p>
      <p>Predicted Salary Range: ${response.prediction}</p>
      <p>Confidence: ${response.confidence}%</p>
    `;
  });
  
  // Render form
  const container = document.getElementById('form-container');
  await mlForm.toHTMLElement(schema, container);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeForm);
```

## Next Steps

- 📚 Learn about [Field Types](../guides/field-types)
- 🤖 Understand [Model Types](../guides/model-types)
- 🎨 Explore [Styling](../guides/styling)
- 💡 Check more [Examples](../examples/basic-form)
