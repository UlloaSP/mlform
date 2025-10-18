---
sidebar_position: 2
---

# Field Types

MLForm supports multiple field types for building dynamic forms.

## Available Field Types

```typescript
enum FieldTypes {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  CATEGORY = 'category',
  DATE = 'date'
}
```

## Text Field

For single-line text input.

### Schema

```typescript
{
  type: 'text',
  title: string,
  description?: string,
  required?: boolean,
  minLength?: number,
  maxLength?: number,
  pattern?: string
}
```

### Example

```typescript
{
  type: 'text',
  title: 'Full Name',
  description: 'Enter your complete name',
  required: true,
  minLength: 2,
  maxLength: 100
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | *required* | Label displayed to user |
| `description` | `string` | - | Help text shown below field |
| `required` | `boolean` | `true` | Whether field is mandatory |
| `minLength` | `number` | - | Minimum character length |
| `maxLength` | `number` | - | Maximum character length |
| `pattern` | `string` | - | Regex pattern for validation |

---

## Number Field

For numeric input with constraints.

### Schema

```typescript
{
  type: 'number',
  title: string,
  description?: string,
  required?: boolean,
  min?: number,
  max?: number,
  step?: number
}
```

### Example

```typescript
{
  type: 'number',
  title: 'Age',
  description: 'Your age in years',
  required: true,
  min: 0,
  max: 120,
  step: 1
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | *required* | Label displayed to user |
| `description` | `string` | - | Help text shown below field |
| `required` | `boolean` | `true` | Whether field is mandatory |
| `min` | `number` | - | Minimum allowed value |
| `max` | `number` | - | Maximum allowed value |
| `step` | `number` | - | Increment/decrement step |

---

## Boolean Field

For true/false or yes/no input.

### Schema

```typescript
{
  type: 'boolean',
  title: string,
  description?: string,
  required?: boolean
}
```

### Example

```typescript
{
  type: 'boolean',
  title: 'Subscribe to Newsletter',
  description: 'Receive weekly updates',
  required: false
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | *required* | Label displayed to user |
| `description` | `string` | - | Help text shown below field |
| `required` | `boolean` | `true` | Whether field is mandatory |

---

## Category Field

For selecting from predefined options.

### Schema

```typescript
{
  type: 'category',
  title: string,
  description?: string,
  required?: boolean,
  options: string[],
  multiple?: boolean
}
```

### Example

```typescript
{
  type: 'category',
  title: 'Department',
  description: 'Select your department',
  required: true,
  options: ['Engineering', 'Sales', 'Marketing', 'HR'],
  multiple: false
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | *required* | Label displayed to user |
| `description` | `string` | - | Help text shown below field |
| `required` | `boolean` | `true` | Whether field is mandatory |
| `options` | `string[]` | *required* | Available choices |
| `multiple` | `boolean` | `false` | Allow multiple selections |

---

## Date Field

For date input with validation.

### Schema

```typescript
{
  type: 'date',
  title: string,
  description?: string,
  required?: boolean,
  min?: string,
  max?: string,
  format?: string
}
```

### Example

```typescript
{
  type: 'date',
  title: 'Birth Date',
  description: 'Select your date of birth',
  required: true,
  min: '1900-01-01',
  max: '2024-12-31',
  format: 'YYYY-MM-DD'
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | *required* | Label displayed to user |
| `description` | `string` | - | Help text shown below field |
| `required` | `boolean` | `true` | Whether field is mandatory |
| `min` | `string` | - | Earliest allowed date |
| `max` | `string` | - | Latest allowed date |
| `format` | `string` | `'YYYY-MM-DD'` | Date format string |

---

## Common Properties

All field types share these base properties:

### BaseField

```typescript
interface BaseField {
  title: string;        // 1-100 chars, non-empty
  description?: string; // 1-500 chars
  required?: boolean;   // Default: true
}
```

### Validation Rules

- `title` must be 1-100 characters and match `/^\S.*\S$/`
- `description` (if provided) must be 1-500 characters
- `required` defaults to `true`

## Complete Example

```typescript
const schema = {
  inputs: [
    {
      type: 'text',
      title: 'Full Name',
      description: 'Enter your legal name',
      required: true,
      minLength: 2,
      maxLength: 100
    },
    {
      type: 'number',
      title: 'Years of Experience',
      description: 'Total years in your field',
      required: true,
      min: 0,
      max: 50
    },
    {
      type: 'category',
      title: 'Department',
      options: ['Engineering', 'Sales', 'Marketing'],
      required: true
    },
    {
      type: 'boolean',
      title: 'Remote Worker',
      required: false
    },
    {
      type: 'date',
      title: 'Start Date',
      min: '2024-01-01',
      required: true
    }
  ],
  outputs: []
};
```

## Type Import

```typescript
import { FieldTypes } from 'mlform/strategies';

console.log(FieldTypes.TEXT);     // 'text'
console.log(FieldTypes.NUMBER);   // 'number'
console.log(FieldTypes.BOOLEAN);  // 'boolean'
console.log(FieldTypes.CATEGORY); // 'category'
console.log(FieldTypes.DATE);     // 'date'
```

## See Also

- [MLForm Class](./mlform)
- [Model Types](./model-types)
- [Examples](../examples/basic-form)
