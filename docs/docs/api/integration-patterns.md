---
sidebar_position: 5
---

# Integration Patterns

Common patterns for integrating MLForm into your applications and workflows.

## Backend Integration

### Simple REST API

```typescript
import { MLForm } from 'mlform';

const mlForm = new MLForm('https://your-api.com/predict');

// The form will automatically send inputs to this endpoint
mlForm.onSubmit((inputs, response) => {
  // Handle the response
  console.log('Prediction:', response.outputs?.[0]?.prediction);
});

await mlForm.toHTMLElement(schema, container);
```

**Backend Endpoint Requirements:**
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Request Body:**
```json
{
  "inputs": {
    "field_name": "value",
    "another_field": 42
  }
}
```
- **Response Format:**
```json
{
  "outputs": [
    {
      "type": "classifier",
      "prediction": "class_A",
      "confidence": 0.95
    }
  ]
}
```

### With Error Handling

```typescript
import { MLForm } from 'mlform';

const mlForm = new MLForm('https://your-api.com/predict');

mlForm.onSubmit(async (inputs, response) => {
  try {
    // Check if response is valid
    if (!response?.outputs) {
      throw new Error('No outputs in response');
    }

    const output = response.outputs[0];
    if (!output?.prediction) {
      throw new Error('Missing prediction field');
    }

    // Process valid response
    displayResult(output.prediction);
  } catch (error) {
    console.error('Error processing response:', error);
    showErrorMessage('Failed to get prediction');
  }
});
```

---

## Framework Integration

### React

```typescript
import { useEffect, useRef } from 'react';
import { MLForm } from 'mlform';

export function PredictionForm({ schema, onPrediction }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mlFormRef = useRef<MLForm | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize MLForm
    mlFormRef.current = new MLForm('https://api.example.com/predict');

    // Register strategies if needed
    // mlFormRef.current.register(new CustomStrategy());

    // Subscribe to submissions
    const unsubscribe = mlFormRef.current.onSubmit((inputs, response) => {
      onPrediction({ inputs, response });
    });

    // Render form
    mlFormRef.current.toHTMLElement(schema, containerRef.current);

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [schema, onPrediction]);

  return <div ref={containerRef} />;
}

// Usage
export function App() {
  const handlePrediction = ({ inputs, response }) => {
    console.log('Predicted:', response.outputs?.[0]?.prediction);
  };

  return (
    <PredictionForm
      schema={{
        inputs: [{ type: 'text', title: 'Input' }],
        outputs: [{ type: 'classifier', title: 'Output' }]
      }}
      onPrediction={handlePrediction}
    />
  );
}
```

### Vue

```typescript
import { onMounted, onUnmounted, ref } from 'vue';
import { MLForm } from 'mlform';

export default {
  props: {
    schema: Object,
    backendUrl: String
  },

  emits: ['prediction'],

  setup(props, { emit }) {
    const container = ref<HTMLDivElement>();
    let mlForm: MLForm | null = null;
    let unsubscribe: (() => void) | null = null;

    onMounted(async () => {
      if (!container.value) return;

      mlForm = new MLForm(props.backendUrl);

      unsubscribe = mlForm.onSubmit((inputs, response) => {
        emit('prediction', { inputs, response });
      });

      await mlForm.toHTMLElement(props.schema, container.value);
    });

    onUnmounted(() => {
      if (unsubscribe) unsubscribe();
    });

    return { container };
  },

  template: '<div ref="container" />'
};

// Usage in parent
<PredictionForm
  :schema="formSchema"
  :backend-url="apiEndpoint"
  @prediction="handlePrediction"
/>
```

### Angular

```typescript
import { Component, Input, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { MLForm } from 'mlform';

@Component({
  selector: 'app-prediction-form',
  template: '<div #container></div>'
})
export class PredictionFormComponent implements OnInit, OnDestroy {
  @Input() schema: any;
  @Input() backendUrl: string = 'https://api.example.com/predict';
  @ViewChild('container') containerRef!: ElementRef;

  private mlForm: MLForm | null = null;
  private unsubscribe: (() => void) | null = null;

  ngOnInit() {
    this.initializeForm();
  }

  private async initializeForm() {
    if (!this.containerRef?.nativeElement) return;

    this.mlForm = new MLForm(this.backendUrl);

    this.unsubscribe = this.mlForm.onSubmit((inputs, response) => {
      console.log('Prediction received:', response.outputs?.[0]?.prediction);
    });

    await this.mlForm.toHTMLElement(this.schema, this.containerRef.nativeElement);
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
}
```

---

## Form Customization

### Multiple Strategies Registration

```typescript
import { MLForm } from 'mlform';
import {
  ColorPickerStrategy,
  SliderStrategy,
  FileUploadStrategy
} from './custom-strategies';

const mlForm = new MLForm('https://api.example.com/predict');

// Register all custom strategies
mlForm.register(new ColorPickerStrategy());
mlForm.register(new SliderStrategy());
mlForm.register(new FileUploadStrategy());

// Now users can choose from all available field types
const schema = {
  inputs: [
    { type: 'text', title: 'Name' },
    { type: 'color', title: 'Favorite Color' },
    { type: 'slider', title: 'Confidence Level' },
    { type: 'file', title: 'Upload Data' }
  ],
  outputs: [{ type: 'classifier', title: 'Prediction' }]
};
```

### Dynamic Strategy Registration

```typescript
import { MLForm } from 'mlform';

const mlForm = new MLForm('https://api.example.com/predict');

// Load strategies based on configuration
async function setupStrategies(config) {
  for (const strategyName of config.strategies) {
    const module = await import(`./strategies/${strategyName}`);
    const Strategy = module.default;
    mlForm.register(new Strategy());
  }
}

// Usage
await setupStrategies({
  strategies: ['text', 'number', 'custom-color']
});
```

### Updating Strategies

```typescript
import { MLForm } from 'mlform';
import { v1: TextStrategyV1, v2: TextStrategyV2 } from './text-strategies';

const mlForm = new MLForm('https://api.example.com/predict');

// Register v1
mlForm.register(new TextStrategyV1());

// Render form (uses v1)
await mlForm.toHTMLElement(schema, container);

// Later, update to v2
mlForm.update(new TextStrategyV2());

// Re-render with updated strategy
await mlForm.toHTMLElement(schema, container);
```

---

## Schema Management

### Schema Validation Before Rendering

```typescript
import { MLForm } from 'mlform';

const mlForm = new MLForm('https://api.example.com/predict');

const schema = {
  inputs: [
    {
      type: 'text',
      title: 'User Input',
      minLength: 5,
      maxLength: 100,
      pattern: '^[a-zA-Z0-9]+$'
    }
  ],
  outputs: [{ type: 'classifier', title: 'Result' }]
};

// Validate before rendering
const validation = await mlForm.validateSchema(schema);

if (!validation.success) {
  console.error('Schema has errors:');
  console.error(validation.error.format());
  return;
}

// Safe to render
await mlForm.toHTMLElement(schema, container);
```

### JSON Schema Generation

```typescript
import { MLForm } from 'mlform';

const mlForm = new MLForm('https://api.example.com/predict');

// Register all strategies
mlForm.register(new TextStrategy());
mlForm.register(new NumberStrategy());

// Generate JSON Schema
const jsonSchema = mlForm.schema();

// Use for API documentation
console.log(JSON.stringify(jsonSchema, null, 2));

// Or save to file for tooling
fs.writeFileSync('schema.json', JSON.stringify(jsonSchema, null, 2));
```

### TypeScript Schema Inference

```typescript
import { MLForm } from 'mlform';
import { type Infer } from 'mlform';
import * as z from 'zod';

// Define with Zod
const FormSchema = z.strictObject({
  inputs: z.array(z.object({
    type: z.string(),
    title: z.string(),
    required: z.optional(z.boolean())
  })),
  outputs: z.array(z.object({
    type: z.enum(['classifier', 'regressor']),
    title: z.optional(z.string())
  }))
});

// Extract TypeScript type
type FormSchemaType = Infer<typeof FormSchema>;

// Fully typed schema object
const myForm: FormSchemaType = {
  inputs: [
    { type: 'text', title: 'Name', required: true }
  ],
  outputs: [
    { type: 'classifier', title: 'Prediction' }
  ]
};

const mlForm = new MLForm('https://api.example.com/predict');
await mlForm.toHTMLElement(myForm, container);
```

---

## Data Handling

### Pre-filling Forms

```typescript
import { MLForm } from 'mlform';

const schema = {
  inputs: [
    { type: 'text', title: 'Name', value: 'John Doe' },
    { type: 'number', title: 'Age', value: 30, min: 0, max: 120 },
    { type: 'category', title: 'Country', options: ['USA', 'UK', 'CA'], value: 'USA' }
  ],
  outputs: []
};

const mlForm = new MLForm('https://api.example.com/predict');
await mlForm.toHTMLElement(schema, container);
```

### Accessing Last Submission

```typescript
import { MLForm } from 'mlform';

const mlForm = new MLForm('https://api.example.com/predict');

mlForm.onSubmit((inputs, response) => {
  console.log('Form submitted');
});

// Wait for user to submit
await mlForm.toHTMLElement(schema, container);

// Later, access previous data
button.addEventListener('click', () => {
  const lastInputs = mlForm.lastInputs;
  const lastResponse = mlForm.lastResponse;

  if (lastInputs) {
    console.log('Last submitted values:', lastInputs);
  }

  if (lastResponse?.outputs?.length) {
    console.log('Last prediction:', lastResponse.outputs[0]);
  }
});
```

### Form State Management

```typescript
import { MLForm } from 'mlform';

class FormManager {
  private mlForm: MLForm;
  private submissions: Array<{ inputs: any; response: any }> = [];
  private currentIndex = -1;

  constructor(backendUrl: string) {
    this.mlForm = new MLForm(backendUrl);
    this.setupListeners();
  }

  private setupListeners() {
    this.mlForm.onSubmit((inputs, response) => {
      this.submissions.push({ inputs, response });
      this.currentIndex = this.submissions.length - 1;
    });
  }

  async render(schema: any, container: HTMLElement) {
    await this.mlForm.toHTMLElement(schema, container);
  }

  getCurrentSubmission() {
    return this.submissions[this.currentIndex] || null;
  }

  getAllSubmissions() {
    return this.submissions;
  }

  getLastInputs() {
    return this.mlForm.lastInputs;
  }
}

// Usage
const manager = new FormManager('https://api.example.com/predict');
await manager.render(schema, container);

// Later
console.log(manager.getAllSubmissions());
```

---

## Advanced Patterns

### Conditional Form Rendering

```typescript
import { MLForm } from 'mlform';

async function createConditionalForm(userType: string, container: HTMLElement) {
  const mlForm = new MLForm('https://api.example.com/predict');

  let schema = {
    inputs: [
      { type: 'text', title: 'Name', required: true }
    ],
    outputs: []
  };

  // Add fields based on user type
  if (userType === 'premium') {
    schema.inputs.push(
      { type: 'color', title: 'Preference' },
      { type: 'slider', title: 'Confidence' }
    );
  } else {
    schema.inputs.push(
      { type: 'category', title: 'Category', options: ['A', 'B', 'C'] }
    );
  }

  await mlForm.toHTMLElement(schema, container);

  mlForm.onSubmit((inputs) => {
    console.log(`${userType} submitted:`, inputs);
  });
}

// Usage
await createConditionalForm('premium', container);
```

### Chained Predictions

```typescript
import { MLForm } from 'mlform';

async function chainedPredictions() {
  const mlForm1 = new MLForm('https://api.example.com/model1');
  const mlForm2 = new MLForm('https://api.example.com/model2');

  const schema1 = {
    inputs: [{ type: 'text', title: 'Input' }],
    outputs: [{ type: 'classifier', title: 'Output' }]
  };

  const container1 = document.getElementById('form1')!;
  await mlForm1.toHTMLElement(schema1, container1);

  // First model's output becomes second model's input
  mlForm1.onSubmit((inputs, response) => {
    const result = response.outputs?.[0]?.prediction;

    const schema2 = {
      inputs: [
        { type: 'text', title: 'First Result', value: String(result) },
        { type: 'number', title: 'Additional Input' }
      ],
      outputs: [{ type: 'regressor', title: 'Final Output' }]
    };

    const container2 = document.getElementById('form2')!;
    mlForm2.toHTMLElement(schema2, container2);
  });
}

chainedPredictions();
```

### Multi-Model Ensemble

```typescript
import { MLForm } from 'mlform';

async function ensembleModels() {
  const models = [
    new MLForm('https://api.example.com/model1'),
    new MLForm('https://api.example.com/model2'),
    new MLForm('https://api.example.com/model3')
  ];

  const schema = {
    inputs: [{ type: 'text', title: 'Input', required: true }],
    outputs: [{ type: 'classifier', title: 'Prediction' }]
  };

  const container = document.getElementById('form')!;

  // Use first model's form
  await models[0].toHTMLElement(schema, container);

  const predictions: any[] = [];

  // Collect predictions from all models
  models.forEach((model, index) => {
    model.onSubmit(async (inputs, response) => {
      predictions[index] = response.outputs?.[0]?.prediction;

      // If all models have responded, show ensemble result
      if (predictions.every(p => p !== undefined)) {
        const result = majorityVote(predictions);
        showEnsembleResult(result);
      }
    });
  });

  // Submit to all models simultaneously
  function submitToAll(inputs: any) {
    models.forEach(model => {
      // Trigger submission to each model
      // (This would require exposing a method or simulating form submission)
    });
  }
}

function majorityVote(predictions: any[]): any {
  const counts = new Map<any, number>();
  predictions.forEach(p => {
    counts.set(p, (counts.get(p) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
```

---

## Testing Patterns

### Mocking for Tests

```typescript
import { MLForm } from 'mlform';
import { describe, it, expect, vi } from 'vitest';

describe('Form integration', () => {
  it('handles predictions correctly', async () => {
    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({
          outputs: [{
            type: 'classifier',
            prediction: 'success'
          }]
        }))
      )
    );

    const mlForm = new MLForm('https://api.example.com/predict');
    const schema = {
      inputs: [{ type: 'text', title: 'Test' }],
      outputs: [{ type: 'classifier', title: 'Result' }]
    };

    const container = document.createElement('div');
    await mlForm.toHTMLElement(schema, container);

    // Simulate user input and submission
    const predictions: any[] = [];
    mlForm.onSubmit((inputs, response) => {
      predictions.push(response.outputs?.[0]?.prediction);
    });

    expect(fetch).toHaveBeenCalled();
  });
});
```

### Schema Validation Testing

```typescript
import { MLForm } from 'mlform';
import { describe, it, expect } from 'vitest';

describe('Schema validation', () => {
  it('rejects invalid schemas', async () => {
    const mlForm = new MLForm('https://api.example.com');

    const invalidSchema = {
      inputs: [
        {
          type: 'invalid-type',
          title: 'Field'
        }
      ],
      outputs: []
    };

    const validation = await mlForm.validateSchema(invalidSchema);
    expect(validation.success).toBe(false);
  });

  it('accepts valid schemas', async () => {
    const mlForm = new MLForm('https://api.example.com');

    const validSchema = {
      inputs: [
        { type: 'text', title: 'Name', required: true }
      ],
      outputs: [{ type: 'classifier', title: 'Prediction' }]
    };

    const validation = await mlForm.validateSchema(validSchema);
    expect(validation.success).toBe(true);
  });
});
```

---

## Performance Optimization

### Lazy Loading Strategies

```typescript
import { FieldStrategy } from 'mlform/extensions';

// Strategy loads component only when needed
class OptimizedStrategy extends FieldStrategy {
  constructor() {
    super(
      'color',
      ColorSchema,
      // Component only imports when strategy is used
      () => import(/* webpackChunkName: "color-field" */ './color-field')
    );
  }

  buildControl(field) {
    return { tag: 'color-field', props: { value: field.value } };
  }
}
```

### Memoizing Validation

```typescript
import { MLForm } from 'mlform';

class CachedMLForm {
  private mlForm: MLForm;
  private schemaCache = new Map<string, any>();

  constructor(backendUrl: string) {
    this.mlForm = new MLForm(backendUrl);
  }

  async validateSchemaCached(schema: any) {
    const key = JSON.stringify(schema);

    if (this.schemaCache.has(key)) {
      return this.schemaCache.get(key);
    }

    const result = await this.mlForm.validateSchema(schema);
    this.schemaCache.set(key, result);
    return result;
  }

  async renderIfValid(schema: any, container: HTMLElement) {
    const validation = await this.validateSchemaCached(schema);
    if (!validation.success) return false;

    await this.mlForm.toHTMLElement(schema, container);
    return true;
  }
}
```

---

## Related Documentation

- [Complete API Reference](./api-reference) - Full API documentation
- [Usage Guide](../getting-started/usage-guide) - Step-by-step tutorial
- [Basic Form Example](../examples/basic-form) - Simple form setup
- [ML Classification Example](../examples/ml-classification) - ML integration
