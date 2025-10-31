---
sidebar_position: 3
---

# Usage Guide

This comprehensive guide shows how to use MLForm effectively, from basic forms to creating custom field strategies.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Working with Inputs](#working-with-inputs)
3. [Handling Submissions](#handling-submissions)
4. [Machine Learning Integration](#machine-learning-integration)
5. [Creating Custom Strategies](#creating-custom-strategies)
6. [Best Practices](#best-practices)

## Basic Usage

### Creating Your First Form

The simplest way to create a form with MLForm:

```typescript
import { MLForm } from 'mlform';

// Step 1: Create an MLForm instance
const mlForm = new MLForm('https://api.example.com/predict');

// Step 2: Define your form schema
const schema = {
  inputs: [
    {
      type: 'text',
      title: 'Full Name',
      required: true
    },
    {
      type: 'number',
      title: 'Age',
      min: 0,
      max: 120,
      required: true
    }
  ],
  outputs: [] // No ML predictions for now
};

// Step 3: Render the form into the DOM
const container = document.getElementById('form-container')!;
await mlForm.toHTMLElement(schema, container);
```

### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My MLForm App</title>
</head>
<body>
  <div id="form-container"></div>
  <script type="module" src="./app.js"></script>
</body>
</html>
```

## Working with Inputs

### Available Field Types

MLForm supports five built-in field types:

#### Text Input

For text-based data with optional pattern validation:

```typescript
{
  type: 'text',
  title: 'Email Address',
  description: 'Your contact email',
  placeholder: 'example@domain.com',
  pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
  minLength: 5,
  maxLength: 254,
  required: true
}
```

**Available options:**
- `value` - Initial/default value (string, optional)
- `placeholder` - Placeholder text (string, optional)
- `pattern` - Regex pattern for validation (string, optional)
- `minLength` - Minimum length (number, optional)
- `maxLength` - Maximum length (number, optional)

#### Number Input

For numeric values with range constraints:

```typescript
{
  type: 'number',
  title: 'Annual Salary',
  description: 'Your yearly income in USD',
  min: 0,
  max: 1000000,
  step: 1000,
  required: true
}
```

**Available options:**
- `value` - Initial/default value (number, optional)
- `min` - Minimum value (number, optional)
- `max` - Maximum value (number, optional)
- `step` - Increment step (number, optional)

#### Boolean Input

For true/false selections (typically rendered as checkbox):

```typescript
{
  type: 'boolean',
  title: 'I agree to the terms',
  description: 'Please read our terms of service',
  required: true
}
```

#### Category Input

For selecting one or multiple options from a list:

```typescript
{
  type: 'category',
  title: 'Department',
  description: 'Select your working department',
  options: ['Engineering', 'Sales', 'Marketing', 'HR'],
  value: 'Engineering', // default selection
  required: true
}
```

**Available options:**
- `options` - Array of available choices (string[], required)
- `value` - Initial selection (string, optional)

#### Date Input

For date selection with optional format and range:

```typescript
{
  type: 'date',
  title: 'Birth Date',
  description: 'Your date of birth',
  min: '1900-01-01',
  max: '2024-12-31',
  value: '2000-01-15',
  required: true
}
```

**Available options:**
- `value` - Initial date (ISO 8601 format, optional)
- `min` - Minimum date (ISO 8601 format, optional)
- `max` - Maximum date (ISO 8601 format, optional)

### Common Field Properties

All field types share these properties:

```typescript
{
  type: 'text' | 'number' | 'boolean' | 'category' | 'date', // Required
  title: 'Field Label', // Required - displayed to user
  description: 'Helper text', // Optional - additional info
  required: true // Optional - defaults to true
}
```

## Handling Submissions

### Listen to Form Submissions

Subscribe to form submission events:

```typescript
const unsubscribe = mlForm.onSubmit((inputs, response) => {
  console.log('Form submitted!');
  console.log('User inputs:', inputs);
  // inputs = { 'Full Name': 'John Doe', 'Age': 30 }
  
  // Handle the response (empty if no outputs defined)
  console.log('Response:', response);
});

// Unsubscribe when no longer needed
// unsubscribe();
```

### Access Inputs by Field Title

Field titles become keys in the inputs object:

```typescript
mlForm.onSubmit((inputs, response) => {
  const fullName = inputs['Full Name'];
  const age = inputs['Age'];
  const department = inputs['Department'];
  
  console.log(`${fullName} is ${age} years old`);
});
```

### Multiple Listeners

You can register multiple submission handlers:

```typescript
// Handler 1: Log to console
const unsub1 = mlForm.onSubmit((inputs) => {
  console.log('Submission #1:', inputs);
});

// Handler 2: Send to backend
const unsub2 = mlForm.onSubmit((inputs) => {
  fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputs)
  });
});

// Handler 3: Update UI
const unsub3 = mlForm.onSubmit((inputs) => {
  updateDashboard(inputs);
});
```

### Access Last Submission Synchronously

Retrieve the most recent submission data without a callback:

```typescript
// After user submits the form
setTimeout(() => {
  const lastInputs = mlForm.lastInputs;
  const lastResponse = mlForm.lastResponse;
  
  if (lastInputs) {
    console.log('Last submitted:', lastInputs);
  }
}, 1000);
```

## Machine Learning Integration

### Adding Model Outputs

Define model outputs in your schema to receive predictions:

```typescript
const schema = {
  inputs: [
    { type: 'number', title: 'House Size (sqft)', required: true },
    { type: 'number', title: 'Bedrooms', required: true },
    { type: 'category', title: 'Location', options: ['Urban', 'Suburban', 'Rural'], required: true }
  ],
  outputs: [
    {
      type: 'classifier',
      title: 'Price Category',
      mapping: ['Budget', 'Mid-Range', 'Luxury'],
      details: true
    }
  ]
};
```

### Expected Backend Payload

When the form is submitted, MLForm sends this JSON to your backend:

```json
{
  "inputs": {
    "House Size (sqft)": 2500,
    "Bedrooms": 3,
    "Location": "Suburban"
  }
}
```

### Expected Backend Response

Your backend should respond with predictions:

```json
{
  "outputs": [
    {
      "type": "classifier",
      "prediction": "Mid-Range",
      "confidence": 0.87,
      "probabilities": {
        "Budget": 0.05,
        "Mid-Range": 0.87,
        "Luxury": 0.08
      },
      "execution_time": 42
    }
  ]
}
```

### Processing ML Responses

```typescript
mlForm.onSubmit((inputs, response) => {
  // Access prediction results
  console.log('Prediction:', response.outputs?.[0]?.prediction);
  console.log('Confidence:', response.outputs?.[0]?.confidence);
  
  // Display results to user
  if (response.outputs?.[0]?.confidence > 0.8) {
    console.log('High confidence prediction!');
  }
});
```

### Output Types

#### Classifier Output

For discrete/categorical predictions:

```typescript
{
  type: 'classifier',
  title: 'Risk Level',
  mapping: ['Low', 'Medium', 'High'], // Optional: label mapping
  probabilities: [[0.1, 0.7, 0.2]], // Optional: probability matrix
  details: false // Optional: show detailed info
}
```

#### Regressor Output

For continuous/numeric predictions:

```typescript
{
  type: 'regressor',
  title: 'Price Prediction',
  details: true // Optional: show confidence intervals
}
```

Expected regressor response:

```json
{
  "outputs": [
    {
      "type": "regressor",
      "prediction": 450000,
      "confidence_interval": [420000, 480000],
      "std_deviation": 15000,
      "execution_time": 38
    }
  ]
}
```

## Creating Custom Strategies

### Why Create Custom Strategies?

Custom strategies allow you to:
- Add new field types (color picker, slider, file upload, etc.)
- Create specialized output renderers
- Integrate domain-specific components
- Extend MLForm for your unique use case

### Understanding Strategy Architecture

Every strategy has three parts:

1. **Schema Definition** (Zod) - Validates the field configuration
2. **Strategy Class** - Maps configuration to UI components
3. **UI Component** - The actual rendered element

### Creating a Custom Field Strategy

Here's a complete example: a color picker field type.

#### Step 1: Define the Schema

Create a file `src/schemas/ColorFieldSchema.ts`:

```typescript
import * as z from 'zod';

export const ColorFieldSchema = z.strictObject({
  type: z.literal('color'),
  title: z.string().min(1),
  description: z.optional(z.string()),
  required: z.optional(z.boolean().default(true)),
  value: z.optional(z.string().regex(/^#[0-9A-F]{6}$/i)), // Hex color validation
  allowedColors: z.optional(z.array(z.string()).min(1)), // Constrain to specific colors
});

export type ColorField = z.infer<typeof ColorFieldSchema>;
```

#### Step 2: Create the Strategy Class

Create a file `src/strategies/ColorPickerStrategy.ts`:

```typescript
import type { Infer } from 'mlform/extensions';
import { FieldStrategy } from 'mlform/extensions';
import { ColorFieldSchema } from './schemas/ColorFieldSchema';

export class ColorPickerStrategy extends FieldStrategy<typeof ColorFieldSchema> {
  constructor() {
    super(
      'color',                           // type identifier
      ColorFieldSchema,                  // validation schema
      () => import('./ui/color-field')   // lazy-loaded component
    );
  }

  protected buildControl(field: Infer<typeof ColorFieldSchema>) {
    return {
      tag: 'color-field',              // Custom element tag
      props: {
        value: field.value,
        title: field.title,
        allowedColors: field.allowedColors,
      },
    };
  }
}
```

#### Step 3: Create the UI Component

Create a file `src/ui/color-field.ts` (using Lit):

```typescript
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';

export class ColorField extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 8px;
    }

    .color-picker {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .color-option {
      width: 40px;
      height: 40px;
      border: 2px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .color-option.selected {
      border-color: #333;
      box-shadow: 0 0 8px rgba(0,0,0,0.3);
    }

    .color-option:hover {
      border-color: #666;
    }
  `;

  @property({ type: String })
  value: string = '#000000';

  @property({ type: Array })
  allowedColors: string[] = [
    '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF'
  ];

  private dispatchChange() {
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  }

  render() {
    return html`
      <div class="color-picker">
        ${this.allowedColors.map(color => html`
          <div
            class="color-option ${color === this.value ? 'selected' : ''}"
            style="background-color: ${color};"
            @click="${() => {
              this.value = color;
              this.dispatchChange();
            }}"
            title="${color}"
          ></div>
        `)}
      </div>
    `;
  }
}

customElements.define('color-field', ColorField);
```

#### Step 4: Register the Strategy

Use the custom strategy in your form:

```typescript
import { MLForm } from 'mlform';
import { ColorPickerStrategy } from './strategies/ColorPickerStrategy';

// Create instance and register custom strategy
const mlForm = new MLForm('https://api.example.com/predict');
mlForm.register(new ColorPickerStrategy());

// Now you can use the custom type!
const schema = {
  inputs: [
    {
      type: 'color',
      title: 'Brand Color',
      value: '#0066FF',
      allowedColors: ['#0066FF', '#FF0066', '#66FF00', '#FF6600']
    }
  ],
  outputs: []
};

const container = document.getElementById('form-container')!;
await mlForm.toHTMLElement(schema, container);
```

### Creating a Custom Output Strategy

Similar pattern for ML output renderers:

```typescript
import { ReportStrategy } from 'mlform/extensions';

export class CustomReportStrategy extends ReportStrategy<typeof MyOutputSchema> {
  constructor() {
    super(
      'my-output-type',
      MyOutputSchema,
      () => import('./ui/custom-report')
    );
  }

  protected buildControl(output: Infer<typeof MyOutputSchema>) {
    return {
      tag: 'custom-report',
      props: {
        title: output.title,
        data: output.data,
      },
    };
  }
}

// Register it
mlForm.register(new CustomReportStrategy());

// Use in schema
const schema = {
  inputs: [...],
  outputs: [
    {
      type: 'my-output-type',
      title: 'Custom Analysis',
      data: { /* ... */ }
    }
  ]
};
```

### Updating and Removing Strategies

```typescript
// Update an existing strategy
const updatedStrategy = new ColorPickerStrategy();
mlForm.update(updatedStrategy);

// Remove a strategy by type
mlForm.unregister(new ColorPickerStrategy());
```

## Best Practices

### 1. Always Provide Descriptive Field Titles

```typescript
// ✅ Good: Clear, user-friendly
{ type: 'text', title: 'Home Address', required: true }

// ❌ Bad: Vague
{ type: 'text', title: 'addr', required: true }
```

### 2. Use Descriptions for Complex Fields

```typescript
{
  type: 'number',
  title: 'Annual Income',
  description: 'Your gross yearly income in USD (before taxes)',
  min: 0,
  required: true
}
```

### 3. Validate on Schema Definition, Not in Handlers

```typescript
// ✅ Good: Validation in schema
{
  type: 'number',
  title: 'Age',
  min: 18,
  max: 120
}

// ❌ Bad: Validation in handler
mlForm.onSubmit((inputs) => {
  if (inputs['Age'] < 18) alert('Must be 18+');
});
```

### 4. Use Consistent Field Ordering

```typescript
// Organize fields logically
const schema = {
  inputs: [
    // Personal info first
    { type: 'text', title: 'Full Name', required: true },
    { type: 'date', title: 'Birth Date', required: true },
    
    // Contact info second
    { type: 'text', title: 'Email', required: true },
    { type: 'text', title: 'Phone', required: false },
    
    // Additional info last
    { type: 'text', title: 'Company', required: false }
  ]
};
```

### 5. Handle Async Operations in Submission

```typescript
let isProcessing = false;

mlForm.onSubmit(async (inputs, response) => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const result = await fetch('/api/process', {
      method: 'POST',
      body: JSON.stringify(inputs)
    });
    const data = await result.json();
    console.log('Server processed:', data);
  } catch (error) {
    console.error('Processing failed:', error);
  } finally {
    isProcessing = false;
  }
});
```

### 6. Use Proper Error Handling

```typescript
// Validate schema before rendering
const validation = await mlForm.validateSchema(schema);

if (!validation.success) {
  console.error('Invalid schema:', validation.error);
  // Handle validation errors
} else {
  await mlForm.toHTMLElement(schema, container);
}
```

### 7. Manage Memory with Unsubscribe

```typescript
const unsubscribe = mlForm.onSubmit((inputs) => {
  console.log('Form submitted:', inputs);
});

// On component cleanup/unmount
onBeforeUnmount(() => {
  unsubscribe(); // Clean up listener
});
```

### 8. Schema Introspection for Documentation

```typescript
// Generate JSON Schema for your form
const jsonSchema = mlForm.schema();

// Use for:
// - API documentation
// - Client validation
// - Schema validation tools
console.log(JSON.stringify(jsonSchema, null, 2));
```

## Complete Example: Registration Form with ML

Putting it all together:

```typescript
import { MLForm } from 'mlform';

async function setupForm() {
  const mlForm = new MLForm('https://api.example.com/predict');

  const schema = {
    inputs: [
      {
        type: 'text',
        title: 'Full Name',
        minLength: 2,
        maxLength: 100,
        required: true
      },
      {
        type: 'text',
        title: 'Email',
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        required: true
      },
      {
        type: 'number',
        title: 'Years of Experience',
        min: 0,
        max: 60,
        required: true
      },
      {
        type: 'category',
        title: 'Department',
        options: ['Engineering', 'Sales', 'Marketing', 'HR'],
        required: true
      },
      {
        type: 'boolean',
        title: 'Accept terms and conditions',
        required: true
      }
    ],
    outputs: [
      {
        type: 'classifier',
        title: 'Recommended Level',
        mapping: ['Junior', 'Senior', 'Lead']
      }
    ]
  };

  // Validate schema
  const validation = await mlForm.validateSchema(schema);
  if (!validation.success) {
    console.error('Schema validation failed:', validation.error);
    return;
  }

  // Subscribe to submissions
  mlForm.onSubmit((inputs, response) => {
    console.log('=== Form Submission ===');
    console.log('User Data:', {
      name: inputs['Full Name'],
      email: inputs['Email'],
      experience: inputs['Years of Experience'],
      department: inputs['Department']
    });
    
    if (response?.outputs?.[0]) {
      console.log('AI Prediction:', {
        recommendation: response.outputs[0].prediction,
        confidence: response.outputs[0].confidence
      });
    }

    updateUI(inputs, response);
  });

  // Render the form
  const container = document.getElementById('form-container')!;
  await mlForm.toHTMLElement(schema, container);
}

function updateUI(inputs: any, response: any) {
  const message = `
    Welcome ${inputs['Full Name']}!
    We recommend: ${response?.outputs?.[0]?.prediction}
  `;
  document.getElementById('result')!.textContent = message;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', setupForm);
```

## Next Steps

- 📚 Learn more about [Field Types](../api/field-types)
- 🤖 Explore [Model Types](../api/model-types)
- 💡 See [Examples](../examples/basic-form)
- 🔧 Read the [API Reference](../api/mlform)
