---
sidebar_position: 1
---

# MLForm Class

The main class for creating and managing dynamic forms with ML capabilities.

## Constructor

```typescript
new MLForm(backendUrl: string)
```

Creates a new MLForm instance.

### Parameters

- **backendUrl** (`string`) - The URL of your backend API for ML predictions

### Example

```typescript
import { MLForm } from 'mlform';

const form = new MLForm('https://api.example.com/predict');
```

## Methods

### toHTMLElement()

```typescript
async toHTMLElement(
  data: Signature, 
  container: HTMLElement
): Promise<HTMLElement>
```

Renders the form into a container element.

#### Parameters

- **data** (`Signature`) - The form schema with inputs and outputs
- **container** (`HTMLElement`) - The DOM element to render the form into

#### Returns

`Promise<HTMLElement>` - The rendered form element

#### Example

```typescript
const schema = {
  inputs: [
    { type: 'text', title: 'Name', required: true }
  ],
  outputs: []
};

const container = document.getElementById('form-container');
const formElement = await mlForm.toHTMLElement(schema, container);
```

---

### register()

```typescript
register(descriptor: FieldStrategy | ReportStrategy): void
```

Registers a custom field or model strategy.

#### Parameters

- **descriptor** (`FieldStrategy | ReportStrategy`) - Custom strategy implementation

#### Example

```typescript
import { FieldStrategy } from 'mlform/extensions';

class CustomFieldStrategy extends FieldStrategy {
  // Implementation
}

const customStrategy = new CustomFieldStrategy();
mlForm.register(customStrategy);
```

---

### update()

```typescript
update(descriptor: FieldStrategy | ReportStrategy): void
```

Updates an existing registered strategy.

#### Parameters

- **descriptor** (`FieldStrategy | ReportStrategy`) - Updated strategy implementation

---

### unregister()

```typescript
unregister(descriptor: FieldStrategy | ReportStrategy): void
```

Removes a registered strategy.

#### Parameters

- **descriptor** (`FieldStrategy | ReportStrategy`) - Strategy to remove

---

### onSubmit()

```typescript
onSubmit(callback: (inputs: Record<string, unknown>, response: Output) => void): () => void
```

Subscribes to form submission events.

#### Parameters

- **callback** (`Function`) - Called when form is submitted
  - **inputs** (`Record<string, unknown>`) - User input values
  - **response** (`Output`) - ML model response

#### Returns

`() => void` - Unsubscribe function

#### Example

```typescript
const unsubscribe = mlForm.onSubmit((inputs, response) => {
  console.log('User inputs:', inputs);
  console.log('Prediction:', response);
});

// Later, to unsubscribe
unsubscribe();
```

## Properties

### lastInputs

```typescript
readonly lastInputs: Record<string, unknown> | null
```

Gets the most recent form submission inputs.

#### Example

```typescript
const inputs = mlForm.lastInputs;
if (inputs) {
  console.log('Last submitted values:', inputs);
}
```

---

### lastResponse

```typescript
readonly lastResponse: Output | null
```

Gets the most recent ML model response.

#### Example

```typescript
const response = mlForm.lastResponse;
if (response) {
  console.log('Last prediction:', response);
}
```

## Types

### Signature

The schema structure for defining forms:

```typescript
interface Signature {
  inputs: Array<{
    type: 'text' | 'number' | 'boolean' | 'category' | 'date';
    title: string;
    description?: string;
    required?: boolean;
    // Type-specific properties...
  }>;
  outputs: Array<{
    type: 'classifier' | 'regressor';
    title?: string;
    // Model-specific properties...
  }>;
}
```

### Output

ML model response structure:

```typescript
interface Output {
  type: 'classifier' | 'regressor';
  prediction?: any;
  confidence?: number;
  execution_time?: number;
  // Additional model-specific fields...
}
```

## Complete Example

```typescript
import { MLForm } from 'mlform';

// Create instance
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
      title: 'Age',
      min: 0,
      max: 120,
      required: true
    }
  ],
  outputs: [
    {
      type: 'classifier',
      title: 'Risk Category'
    }
  ]
};

// Subscribe to submissions
const unsubscribe = mlForm.onSubmit((inputs, response) => {
  console.log('Inputs:', inputs);
  console.log('Prediction:', response);
});

// Render form
const container = document.getElementById('app');
await mlForm.toHTMLElement(schema, container);

// Access last submission anytime
setTimeout(() => {
  console.log('Last inputs:', mlForm.lastInputs);
  console.log('Last response:', mlForm.lastResponse);
}, 5000);

// Clean up
// unsubscribe();
```

## See Also

- [Field Types](./field-types)
- [Model Types](./model-types)
- [Custom Strategies](../guides/custom-strategies)
