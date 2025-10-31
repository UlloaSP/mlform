---
sidebar_position: 4
---

# Complete API Reference

This comprehensive guide covers every public export, interface, type, and method available in MLForm.

## Table of Contents

1. [Main Export](#main-export)
2. [Core Types](#core-types)
3. [Field Strategies](#field-strategies)
4. [Output Strategies](#output-strategies)
5. [Extension Base Classes](#extension-base-classes)
6. [Utility Types](#utility-types)
7. [Import Paths](#import-paths)

---

## Main Export

### MLForm Class

The main class for creating and managing dynamic forms with ML capabilities.

```typescript
import { MLForm } from 'mlform';

const mlForm = new MLForm(backendUrl: string);
```

#### Constructor

```typescript
constructor(backendUrl: string)
```

Creates a new MLForm instance.

**Parameters:**
- `backendUrl` (`string`) - The URL of your backend API for ML predictions (can be any string, only used if outputs defined)

**Example:**
```typescript
const mlForm = new MLForm('https://api.example.com/predict');
```

#### Methods

### toHTMLElement()

```typescript
async toHTMLElement(
  data: Signature,
  container: HTMLElement
): Promise<HTMLElement>
```

Renders the form into a DOM container element and sets up all event listeners.

**Parameters:**
- `data` (`Signature`) - The form schema with inputs and outputs
- `container` (`HTMLElement`) - The DOM element where the form will be mounted

**Returns:**
`Promise<HTMLElement>` - The container element with the rendered form

**Throws:**
- Error if schema is invalid or unsupported field types are used

**Example:**
```typescript
const schema = {
  inputs: [
    { type: 'text', title: 'Name', required: true }
  ],
  outputs: []
};

const container = document.getElementById('form-container')!;
await mlForm.toHTMLElement(schema, container);
```

---

### register()

```typescript
register(descriptor: FieldStrategy | ReportStrategy): void
```

Registers a custom field or output strategy to extend MLForm functionality.

**Parameters:**
- `descriptor` (`FieldStrategy | ReportStrategy`) - Custom strategy implementation

**Throws:**
- Error if strategy type already exists (use `update()` instead)

**Example:**
```typescript
import { FieldStrategy } from 'mlform/extensions';

class ColorPickerStrategy extends FieldStrategy {
  constructor() {
    super('color', ColorSchema, () => import('./color-field'));
  }
  
  buildControl(field) {
    return { tag: 'color-field', props: { value: field.value } };
  }
}

mlForm.register(new ColorPickerStrategy());
```

---

### update()

```typescript
update(descriptor: FieldStrategy | ReportStrategy): void
```

Updates an existing registered strategy, replacing the previous implementation.

**Parameters:**
- `descriptor` (`FieldStrategy | ReportStrategy`) - Updated strategy

**Example:**
```typescript
const updatedStrategy = new ColorPickerStrategy();
mlForm.update(updatedStrategy);
```

---

### unregister()

```typescript
unregister(descriptor: FieldStrategy | ReportStrategy): void
```

Removes a registered strategy by its type identifier.

**Parameters:**
- `descriptor` (`FieldStrategy | ReportStrategy`) - Strategy to remove

**Example:**
```typescript
mlForm.unregister(new ColorPickerStrategy());
```

---

### onSubmit()

```typescript
onSubmit(
  callback: (inputs: Record<string, unknown>, response: Output) => void
): () => void
```

Subscribes to form submission events. Returns an unsubscribe function.

**Parameters:**
- `callback` - Function called on form submission with:
  - `inputs` (`Record<string, unknown>`) - User input values
  - `response` (`Output`) - ML model response (if outputs defined)

**Returns:**
`() => void` - Unsubscribe function to remove the listener

**Example:**
```typescript
const unsubscribe = mlForm.onSubmit((inputs, response) => {
  console.log('Form submitted:', inputs);
  console.log('Prediction:', response);
});

// Later, to stop listening:
unsubscribe();
```

---

### validateSchema()

```typescript
async validateSchema(data: Signature): Promise<unknown>
```

Validates a schema against the current registry before rendering.

**Parameters:**
- `data` (`Signature`) - Schema to validate

**Returns:**
`Promise<unknown>` - Zod safe-parse result with `success` and `error` fields

**Example:**
```typescript
const validation = await mlForm.validateSchema(schema);

if (!validation.success) {
  console.error('Schema validation errors:', validation.error);
} else {
  await mlForm.toHTMLElement(schema, container);
}
```

---

### schema()

```typescript
schema(): object
```

Generates a JSON Schema (draft 2020-12) for your current registry configuration.

**Returns:**
`object` - JSON Schema representation of your form

**Use Cases:**
- API documentation generation
- Schema validation tools
- Introspection for testing

**Example:**
```typescript
const jsonSchema = mlForm.schema();
console.log(JSON.stringify(jsonSchema, null, 2));

// Can be used with tools like https://www.jsonschemavalidator.net/
```

---

## Properties

### lastInputs

```typescript
readonly lastInputs: Record<string, unknown> | null
```

Gets the most recent form submission inputs. Returns `null` if no submission yet.

**Type:** `Record<string, unknown> | null`

**Example:**
```typescript
const previousInputs = mlForm.lastInputs;
if (previousInputs) {
  console.log('Last name entered:', previousInputs['Full Name']);
}
```

---

### lastResponse

```typescript
readonly lastResponse: Output | null
```

Gets the most recent ML model response. Returns `null` if no outputs defined or no submission yet.

**Type:** `Output | null`

**Example:**
```typescript
const prediction = mlForm.lastResponse;
if (prediction?.outputs?.[0]) {
  console.log('Last prediction:', prediction.outputs[0].prediction);
}
```

---

## Core Types

### Signature

The main interface for defining form schemas.

```typescript
interface Signature {
  inputs: Array<BaseField>  // Field definitions
  outputs: Array<BaseModel> // Model output definitions
}
```

**Properties:**
- `inputs` - Array of input field configurations
- `outputs` - Array of ML model output configurations (optional, defaults to `[]`)

**Example:**
```typescript
const signature: Signature = {
  inputs: [
    { type: 'text', title: 'Name', required: true },
    { type: 'number', title: 'Age', min: 0, max: 120, required: true }
  ],
  outputs: [
    { type: 'classifier', title: 'Category' }
  ]
};
```

---

### BaseField

Base properties shared by all field types.

```typescript
interface BaseField {
  type: string              // Field type identifier
  title: string            // 1-100 chars, displayed to user
  description?: string     // 1-500 chars, helper text
  required?: boolean       // Defaults to true
}
```

**Constraints:**
- `title` must match regex `/^\S.*\S$/` (non-empty, no leading/trailing spaces)
- `description` must be 1-500 characters if provided
- All other properties are type-specific

---

### BaseModel

Base properties shared by all model types.

```typescript
interface BaseModel {
  type: string              // 'classifier' or 'regressor'
  title?: string           // Optional display title
  execution_time?: number  // Inference time in milliseconds
}
```

---

### Output

Response structure from ML backend.

```typescript
interface Output {
  outputs?: Array<{
    type: 'classifier' | 'regressor'
    prediction: string | number
    confidence?: number
    probabilities?: Record<string, number>
    confidence_interval?: [number, number]
    std_deviation?: number
    execution_time?: number
  }>
}
```

---

## Field Strategies

All built-in field strategies are available in `mlform/strategies`.

```typescript
import {
  TextStrategy,
  NumberStrategy,
  BooleanStrategy,
  CategoryStrategy,
  DateStrategy
} from 'mlform/strategies';
```

### TextStrategy

Handles text input with validation.

```typescript
const strategy = new TextStrategy();
mlForm.register(strategy);
```

**Field Properties:**
- `type: 'text'`
- `title: string`
- `description?: string`
- `required?: boolean`
- `value?: string` - Initial value
- `placeholder?: string`
- `minLength?: number`
- `maxLength?: number`
- `pattern?: string` - Regex pattern

---

### NumberStrategy

Handles numeric input with range constraints.

```typescript
const strategy = new NumberStrategy();
mlForm.register(strategy);
```

**Field Properties:**
- `type: 'number'`
- `title: string`
- `description?: string`
- `required?: boolean`
- `value?: number` - Initial value
- `min?: number`
- `max?: number`
- `step?: number` - Default: 1
- `placeholder?: string`
- `unit?: string` - Label like 'USD', 'kg'

---

### BooleanStrategy

Handles checkbox/toggle inputs.

```typescript
const strategy = new BooleanStrategy();
mlForm.register(strategy);
```

**Field Properties:**
- `type: 'boolean'`
- `title: string`
- `description?: string`
- `required?: boolean`
- `value?: boolean` - Initial checked state

---

### CategoryStrategy

Handles select/dropdown inputs.

```typescript
const strategy = new CategoryStrategy();
mlForm.register(strategy);
```

**Field Properties:**
- `type: 'category'`
- `title: string`
- `description?: string`
- `required?: boolean`
- `options: string[]` - Available choices (required)
- `value?: string` - Initial selection (must be in options)

---

### DateStrategy

Handles date picker inputs.

```typescript
const strategy = new DateStrategy();
mlForm.register(strategy);
```

**Field Properties:**
- `type: 'date'`
- `title: string`
- `description?: string`
- `required?: boolean`
- `value?: string` - Initial date (ISO 8601)
- `min?: string` - Earliest date (ISO 8601)
- `max?: string` - Latest date (ISO 8601)
- `step?: number` - Day increment (default: 1)

---

## Output Strategies

All built-in output strategies are available in `mlform/strategies`.

```typescript
import {
  ClassifierStrategy,
  RegressorStrategy
} from 'mlform/strategies';
```

### ClassifierStrategy

Renders classification model outputs.

```typescript
const strategy = new ClassifierStrategy();
mlForm.register(strategy);
```

**Output Properties:**
- `type: 'classifier'`
- `title?: string`
- `execution_time?: number`
- `mapping?: string[]` - Label mappings
- `probabilities?: number[][]` - Probability matrix
- `details?: boolean` - Show detailed info

---

### RegressorStrategy

Renders regression model outputs.

```typescript
const strategy = new RegressorStrategy();
mlForm.register(strategy);
```

**Output Properties:**
- `type: 'regressor'`
- `title?: string`
- `execution_time?: number`
- `values?: number[]` - Related values
- `unit?: string` - Unit label
- `interval?: [number, number]` - Confidence interval

---

## Extension Base Classes

For creating custom strategies, extend these base classes from `mlform/extensions`.

```typescript
import {
  FieldStrategy,
  ReportStrategy,
  FieldElement
} from 'mlform/extensions';
```

### FieldStrategy

Base class for custom input field strategies.

```typescript
import { FieldStrategy } from 'mlform/extensions';
import * as z from 'zod';

export class CustomFieldStrategy extends FieldStrategy {
  constructor() {
    super(
      'custom-type',           // type identifier
      CustomSchema,           // Zod schema for validation
      () => import('./custom-field')  // Lazy loader
    );
  }

  protected buildControl(field) {
    return {
      tag: 'custom-field',
      props: {
        value: field.value,
        title: field.title
      }
    };
  }
}
```

**Abstract Methods:**
- `buildControl(field: Infer<S>): { tag: string; props: Record<string, unknown> }`
  - Maps field config to UI component
  - `tag` - Custom element tag name
  - `props` - Properties passed to component

**Constructor Parameters:**
- `type: string` - Unique identifier (e.g., 'color', 'slider')
- `schema: Schema` - Zod validation schema
- `loader: () => Promise<unknown>` - Dynamic import function

---

### ReportStrategy

Base class for custom ML output strategies.

```typescript
import { ReportStrategy } from 'mlform/extensions';

export class CustomReportStrategy extends ReportStrategy {
  constructor() {
    super(
      'custom-output',
      CustomOutputSchema,
      () => import('./custom-report')
    );
  }

  protected buildControl(output) {
    return {
      tag: 'custom-report',
      props: {
        prediction: output.prediction,
        title: output.title
      }
    };
  }
}
```

**Abstract Methods:**
- `buildControl(output: Infer<S>): { tag: string; props: Record<string, unknown> }`
  - Maps output config to UI component

---

### FieldElement

Interface for custom field Web Components.

```typescript
import { FieldElement } from 'mlform/extensions';
```

**Expected Interface:**
- Custom element must dispatch `change` event with `{ detail: { value } }`
- Must accept properties: `value`, `title`, custom props from strategy

**Example:**
```typescript
class ColorField extends HTMLElement {
  value: string = '#000000';
  
  connectedCallback() {
    this.addEventListener('click', () => {
      this.value = '#FF0000';
      this.dispatchEvent(new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      }));
    });
  }
}

customElements.define('color-field', ColorField);
```

---

## Utility Types

### Schema

Generic Zod schema type for validation.

```typescript
import { type Schema } from 'mlform';
import * as z from 'zod';

const MySchema: Schema = z.strictObject({
  type: z.literal('custom'),
  title: z.string(),
  value: z.optional(z.string())
});
```

---

### Infer

Extract TypeScript type from Zod schema.

```typescript
import { type Infer } from 'mlform';
import * as z from 'zod';

const MySchema = z.strictObject({
  type: z.literal('custom'),
  value: z.string()
});

type MyType = Infer<typeof MySchema>;
// MyType = { type: 'custom'; value: string }
```

---

### array

Zod array validator (re-exported for convenience).

```typescript
import { array } from 'mlform';

const schema = array(z.string());
```

---

### union

Zod union validator (re-exported for convenience).

```typescript
import { union } from 'mlform';

const schema = union([z.string(), z.number()]);
```

---

## Import Paths

### Main Package

```typescript
// Default export
import { MLForm } from 'mlform';

// Types
import type { Signature, Output, Base, Infer, Schema } from 'mlform';
```

### Extensions

```typescript
// Base classes for custom strategies
import { FieldStrategy, ReportStrategy } from 'mlform/extensions';

// Base types and schemas
import {
  type BaseField,
  BaseFieldSchema,
  type BaseModel,
  BaseModelSchema
} from 'mlform/extensions';

// UI utilities
import { FieldElement } from 'mlform/extensions';
```

### Strategies

```typescript
// Built-in field strategies
import {
  TextStrategy,
  NumberStrategy,
  BooleanStrategy,
  CategoryStrategy,
  DateStrategy
} from 'mlform/strategies';

// Built-in output strategies
import {
  ClassifierStrategy,
  RegressorStrategy
} from 'mlform/strategies';
```

### Zod (for custom schemas)

```typescript
// MLForm re-exports common Zod utilities
import { array, union } from 'mlform';

// For full Zod usage, import directly
import * as z from 'zod';
```

---

## Complete Example: Custom Color Picker Strategy

Here's a complete, production-ready example showing all the imports and API usage:

```typescript
import * as z from 'zod';
import { MLForm } from 'mlform';
import { FieldStrategy, type Infer } from 'mlform/extensions';

// Step 1: Define schema
const ColorFieldSchema = z.strictObject({
  type: z.literal('color'),
  title: z.string().min(1),
  description: z.optional(z.string()),
  required: z.optional(z.boolean().default(true)),
  value: z.optional(z.string().regex(/^#[0-9A-F]{6}$/i)),
  allowedColors: z.optional(z.array(z.string().regex(/^#[0-9A-F]{6}$/i)).min(1))
});

type ColorField = Infer<typeof ColorFieldSchema>;

// Step 2: Define custom UI component (in color-field.ts)
class ColorField extends HTMLElement {
  value: string = '#000000';
  allowedColors: string[] = ['#FF0000', '#00FF00', '#0000FF'];
  
  connectedCallback() {
    this.render();
  }
  
  render() {
    this.innerHTML = this.allowedColors
      .map(color => `
        <button 
          data-color="${color}"
          style="background: ${color}"
          class="${color === this.value ? 'selected' : ''}"
        ></button>
      `).join('');
    
    this.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.value = btn.dataset.color!;
        this.dispatchEvent(new CustomEvent('change', {
          detail: { value: this.value },
          bubbles: true,
          composed: true
        }));
      });
    });
  }
}

customElements.define('color-field', ColorField);

// Step 3: Create strategy
class ColorPickerStrategy extends FieldStrategy<typeof ColorFieldSchema> {
  constructor() {
    super(
      'color',
      ColorFieldSchema,
      () => import('./color-field')
    );
  }

  protected buildControl(field: ColorField) {
    return {
      tag: 'color-field',
      props: {
        value: field.value,
        allowedColors: field.allowedColors
      }
    };
  }
}

// Step 4: Use in MLForm
async function main() {
  const mlForm = new MLForm('https://api.example.com/predict');
  
  // Register custom strategy
  mlForm.register(new ColorPickerStrategy());
  
  // Validate schema
  const schema = {
    inputs: [
      {
        type: 'text',
        title: 'Name',
        required: true
      },
      {
        type: 'color',
        title: 'Brand Color',
        value: '#0066FF',
        allowedColors: ['#0066FF', '#FF0066', '#66FF00']
      }
    ],
    outputs: []
  };
  
  const validation = await mlForm.validateSchema(schema);
  if (!validation.success) {
    console.error('Invalid schema:', validation.error);
    return;
  }
  
  // Subscribe to submissions
  mlForm.onSubmit((inputs, response) => {
    console.log('Form data:', {
      name: inputs['Name'],
      brandColor: inputs['Brand Color']
    });
  });
  
  // Render form
  const container = document.getElementById('form-container')!;
  await mlForm.toHTMLElement(schema, container);
  
  // Access last submission
  setTimeout(() => {
    if (mlForm.lastInputs) {
      console.log('Previously submitted:', mlForm.lastInputs);
    }
  }, 5000);
}

main();
```

---

## Public API Summary

| Export | Type | Purpose |
|--------|------|---------|
| `MLForm` | Class | Main form manager |
| `FieldStrategy` | Class | Base for custom input strategies |
| `ReportStrategy` | Class | Base for custom output strategies |
| `TextStrategy` | Class | Built-in text field |
| `NumberStrategy` | Class | Built-in number field |
| `BooleanStrategy` | Class | Built-in boolean field |
| `CategoryStrategy` | Class | Built-in category field |
| `DateStrategy` | Class | Built-in date field |
| `ClassifierStrategy` | Class | Built-in classifier output |
| `RegressorStrategy` | Class | Built-in regressor output |
| `BaseFieldSchema` | Zod Schema | Base field validation |
| `BaseModelSchema` | Zod Schema | Base model validation |
| `Signature` | Type | Form schema structure |
| `Output` | Type | ML response structure |
| `Base` | Type | Input field array |
| `Schema` | Type | Zod validation schema |
| `Infer` | Type | Extract type from schema |
| `array` | Function | Zod array validator |
| `union` | Function | Zod union validator |

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Unsupported field type" | Using undefined field type | Register strategy with `mlForm.register()` |
| "Invalid schema" | Schema doesn't match signature | Use `validateSchema()` before rendering |
| "Type already exists" | Registering duplicate type | Use `update()` instead of `register()` |
| "Invalid pattern" | Regex pattern in text field is malformed | Verify regex syntax in `pattern` property |
| "Value not in options" | Category value doesn't match options | Ensure `value` matches one of `options` |
| "Backend connection failed" | Invalid URL or network error | Check `backendUrl` and server availability |

---

## Best Practices

### 1. Always Validate Schemas

```typescript
const validation = await mlForm.validateSchema(schema);
if (!validation.success) {
  console.error('Schema errors:', validation.error);
  return;
}
```

### 2. Use TypeScript for Custom Strategies

```typescript
class MyStrategy extends FieldStrategy<typeof MySchema> {
  // Full type safety
}
```

### 3. Manage Subscriptions

```typescript
const unsubscribe = mlForm.onSubmit((inputs) => {
  // Handle submission
});

// Clean up when component unmounts
onDestroy(() => unsubscribe());
```

### 4. Handle Backend Errors

```typescript
mlForm.onSubmit((inputs, response) => {
  if (!response?.outputs || response.outputs.length === 0) {
    console.error('No predictions received');
    return;
  }
  
  const prediction = response.outputs[0];
  if (!prediction.prediction) {
    console.error('Invalid response format');
    return;
  }
});
```

### 5. Use Lazy Loading for Components

```typescript
// ✅ Good: Lazy load
class MyStrategy extends FieldStrategy {
  constructor() {
    super('my-type', schema, () => import('./my-component'));
  }
}

// ❌ Bad: Eager load
import './my-component'; // Imported at top level
```

---

## Related Documentation

- [Usage Guide](../getting-started/usage-guide) - Practical usage examples
- [Field Types](./field-types) - Detailed field type documentation
- [Model Types](./model-types) - ML output model documentation
- [Basic Form Example](../examples/basic-form) - Simple form setup
- [ML Classification Example](../examples/ml-classification) - ML integration example
