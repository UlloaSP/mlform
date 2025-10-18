---
sidebar_position: 1
---

# Basic Form

Create a simple contact form without ML integration.

## Overview

This example demonstrates:
- Creating a basic form with text, number, and boolean fields
- Form validation
- Accessing form values
- Handling submissions

## Complete Code

```typescript
import { MLForm } from 'mlform';

// Initialize MLForm (backend URL not used for basic forms)
const mlForm = new MLForm('https://api.example.com');

// Define form schema
const schema = {
  inputs: [
    {
      type: 'text',
      title: 'Full Name',
      description: 'Enter your complete name',
      required: true,
      minLength: 2,
      maxLength: 100
    },
    {
      type: 'text',
      title: 'Email',
      description: 'Your email address',
      required: true,
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    },
    {
      type: 'number',
      title: 'Age',
      description: 'Your age in years',
      required: true,
      min: 13,
      max: 120
    },
    {
      type: 'category',
      title: 'Country',
      description: 'Select your country',
      required: true,
      options: [
        'United States',
        'Canada',
        'United Kingdom',
        'Germany',
        'France',
        'Spain',
        'Other'
      ]
    },
    {
      type: 'boolean',
      title: 'Subscribe to Newsletter',
      description: 'Receive updates and news',
      required: false
    }
  ],
  outputs: [] // No ML models
};

// Subscribe to form submissions
mlForm.onSubmit((inputs, response) => {
  console.log('Form submitted!');
  console.log('Name:', inputs['Full Name']);
  console.log('Email:', inputs.Email);
  console.log('Age:', inputs.Age);
  console.log('Country:', inputs.Country);
  console.log('Newsletter:', inputs['Subscribe to Newsletter']);
  
  // Display success message
  alert('Form submitted successfully!');
});

// Render the form
async function initialize() {
  const container = document.getElementById('form-container');
  await mlForm.toHTMLElement(schema, container);
}

// Run when DOM is ready
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
  <title>Basic Contact Form - MLForm</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 600px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    
    h1 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }
    
    .subtitle {
      color: #7f8c8d;
      margin-bottom: 2rem;
    }
    
    #form-container {
      background: #f8f9fa;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <h1>Contact Form</h1>
  <p class="subtitle">Fill out the form below to get in touch</p>
  
  <div id="form-container"></div>
  
  <script type="module" src="./app.js"></script>
</body>
</html>
```

## Key Features

### 1. Text Validation

The email field uses regex pattern validation:

```typescript
{
  type: 'text',
  title: 'Email',
  pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
}
```

### 2. Number Constraints

Age field has min/max validation:

```typescript
{
  type: 'number',
  title: 'Age',
  min: 13,
  max: 120
}
```

### 3. Category Selection

Dropdown with predefined options:

```typescript
{
  type: 'category',
  title: 'Country',
  options: ['United States', 'Canada', 'United Kingdom', /* ... */]
}
```

### 4. Optional Fields

Newsletter subscription is not required:

```typescript
{
  type: 'boolean',
  title: 'Subscribe to Newsletter',
  required: false
}
```

## Accessing Form Data

### During Submission

```typescript
mlForm.onSubmit((inputs, response) => {
  // Access by field title
  const name = inputs['Full Name'];
  const email = inputs.Email;
  
  // Process the data
  sendToBackend(inputs);
});
```

### After Submission

```typescript
// Get the last submitted values
const lastInputs = mlForm.lastInputs;

if (lastInputs) {
  console.log('Previously submitted:', lastInputs);
}
```

## Validation

MLForm automatically validates:

- ✅ Required fields are filled
- ✅ Text matches pattern (email format)
- ✅ Numbers are within min/max range
- ✅ String length is within bounds

## Customization

### Add More Fields

```typescript
{
  type: 'text',
  title: 'Phone Number',
  description: 'Format: +1-234-567-8900',
  pattern: '^\\+?[1-9]\\d{1,14}$',
  required: false
}
```

### Change Field Order

Simply reorder items in the `inputs` array:

```typescript
inputs: [
  { type: 'text', title: 'Email', /* ... */ },
  { type: 'text', title: 'Full Name', /* ... */ },
  // Email now appears first
]
```

## Next Steps

- 📚 Add [ML predictions](./ml-classification) to your form
- 📖 Learn about [Field Types](../api/field-types)
- 🤖 Explore [Model Types](../api/model-types)

## Related Examples

- [ML Classification Form](./ml-classification)
