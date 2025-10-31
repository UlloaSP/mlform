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

// Initialize MLForm (backend URL not used for basic forms, but still required)
const mlForm = new MLForm('https://api.example.com/predict');

// Define form schema
const schema = {
  inputs: [
    {
      type: 'text',
      title: 'Full Name',
      description: 'Enter your complete name',
      required: true,
      minLength: 2,
      maxLength: 100,
      placeholder: 'e.g., John Doe'
    },
    {
      type: 'text',
      title: 'Email',
      description: 'Your email address',
      required: true,
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      placeholder: 'you@example.com'
    },
    {
      type: 'number',
      title: 'Age',
      description: 'Your age in years',
      required: true,
      min: 13,
      max: 120,
      step: 1
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
  pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
  placeholder: 'you@example.com',
  required: true
}
```

**Notes:**
- Pattern must be a valid regex string
- Pattern validation happens client-side on form submission
- Use clear placeholder text to guide users

### 2. Number Constraints

Age field has min/max validation:

```typescript
{
  type: 'number',
  title: 'Age',
  min: 13,
  max: 120,
  step: 1,
  required: true
}
```

**Notes:**
- Min and max values are inclusive
- Step controls the increment (default is 1)
- Value must be between min and max if both are specified

### 3. Category Selection

Dropdown with predefined options:

```typescript
{
  type: 'category',
  title: 'Country',
  options: ['United States', 'Canada', 'United Kingdom'],
  value: 'United States',  // Optional default
  required: true
}
```

**Notes:**
- Only single selection is supported
- The `value` property must match one of the options if provided
- All options must be non-empty strings

### 4. Optional Fields

Newsletter subscription is not required:

```typescript
{
  type: 'boolean',
  title: 'Subscribe to Newsletter',
  required: false,
  value: false  // Optional default
}
```

**Notes:**
- Required defaults to `true` if not specified
- Boolean fields are rendered as checkboxes
- Value property sets the initial state

## Accessing Form Data

### During Submission

```typescript
mlForm.onSubmit((inputs, response) => {
  // Access by field title
  const name = inputs['Full Name'];
  const email = inputs.Email;
  const age = inputs.Age;
  const country = inputs.Country;
  const subscribed = inputs['Subscribe to Newsletter'];
  
  // Data types are preserved
  console.log(typeof age);        // 'number'
  console.log(typeof subscribed); // 'boolean'
  console.log(typeof email);      // 'string'
  
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
  console.log('Name was:', lastInputs['Full Name']);
}
```

### Key Points

- Field titles become keys in the inputs object
- Data types are preserved (numbers stay numbers, booleans stay booleans, etc.)
- Access by exact field title (case-sensitive)
- The `inputs` object structure depends on your schema

## Validation

MLForm automatically validates all fields before submission based on the schema:

### Validation Rules by Field Type

| Field Type | Validations |
|-----------|------------|
| `text` | Required check, minLength, maxLength, pattern (regex) |
| `number` | Required check, min/max range |
| `boolean` | Required check (if required=true, must be checked) |
| `category` | Required check, value must be in options |
| `date` | Required check, min/max date range |

### Validation Example

```typescript
// This schema will validate:
const schema = {
  inputs: [
    {
      type: 'text',
      title: 'Email',
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      required: true
      // Validates: field is filled AND matches email pattern
    },
    {
      type: 'number',
      title: 'Age',
      min: 13,
      max: 120,
      required: true
      // Validates: field is filled AND is between 13-120
    },
    {
      type: 'category',
      title: 'Country',
      options: ['US', 'CA', 'UK'],
      required: true
      // Validates: field is filled AND value is in the options list
    }
  ]
};
```

### Pre-Submission Validation

Validate schema before rendering:

```typescript
// Validate the entire schema before rendering
const validation = await mlForm.validateSchema(schema);

if (!validation.success) {
  console.error('Schema validation errors:', validation.error);
  // Don't render if schema is invalid
} else {
  const container = document.getElementById('form-container');
  await mlForm.toHTMLElement(schema, container);
}
```

### Notes

- ✅ Validation is automatic and built-in
- ✅ Invalid forms prevent submission
- ✅ Error messages display near the invalid fields
- ✅ All validation happens on the client before backend is called

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
