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
  pattern?: string,
  placeholder?: string,
  value?: string
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
  maxLength: 100,
  placeholder: 'e.g., John Doe'
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | *required* | Label displayed to user (1-100 chars) |
| `description` | `string` | - | Help text shown below field (1-500 chars) |
| `required` | `boolean` | `true` | Whether field is mandatory |
| `minLength` | `number` | - | Minimum character length |
| `maxLength` | `number` | - | Maximum character length |
| `pattern` | `string` | - | Regex pattern for validation (valid regex) |
| `placeholder` | `string` | - | Placeholder hint text |
| `value` | `string` | - | Initial/default value |

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
  step?: number,
  placeholder?: string,
  value?: number,
  unit?: string
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
  step: 1,
  placeholder: '25'
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | *required* | Label displayed to user (1-100 chars) |
| `description` | `string` | - | Help text shown below field (1-500 chars) |
| `required` | `boolean` | `true` | Whether field is mandatory |
| `min` | `number` | - | Minimum allowed value |
| `max` | `number` | - | Maximum allowed value |
| `step` | `number` | `1` | Increment/decrement step (must be positive) |
| `placeholder` | `string` | - | Placeholder hint text |
| `value` | `number` | - | Initial/default value |
| `unit` | `string` | - | Unit label (e.g., 'USD', 'kg', '%') |

---

## Boolean Field

For true/false or yes/no input.

### Schema

```typescript
{
  type: 'boolean',
  title: string,
  description?: string,
  required?: boolean,
  value?: boolean
}
```

### Example

```typescript
{
  type: 'boolean',
  title: 'Subscribe to Newsletter',
  description: 'Receive weekly updates',
  required: false,
  value: true
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | *required* | Label displayed to user (1-100 chars) |
| `description` | `string` | - | Help text shown below field (1-500 chars) |
| `required` | `boolean` | `true` | Whether field is mandatory |
| `value` | `boolean` | - | Initial/default checked state |

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
  value?: string
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
  value: 'Engineering'
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | *required* | Label displayed to user (1-100 chars) |
| `description` | `string` | - | Help text shown below field (1-500 chars) |
| `required` | `boolean` | `true` | Whether field is mandatory |
| `options` | `string[]` | *required* | Available choices (min. 1 option) |
| `value` | `string` | - | Initial selection (must be in options) |

### Notes

- The `value` property, if provided, must match one of the items in `options`
- Only single selection is supported (not multiple)
- All options must be non-empty strings

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
  value?: string,
  step?: number
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
  value: '2000-01-15'
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | *required* | Label displayed to user (1-100 chars) |
| `description` | `string` | - | Help text shown below field (1-500 chars) |
| `required` | `boolean` | `true` | Whether field is mandatory |
| `min` | `string` | - | Earliest allowed date (ISO 8601 format) |
| `max` | `string` | - | Latest allowed date (ISO 8601 format) |
| `value` | `string` | - | Initial date (ISO 8601 format) |
| `step` | `number` | `1` | Day step increment (must be >= 1) |

### Notes

- All dates must be in ISO 8601 format: `YYYY-MM-DD`
- The `value` property, if provided, must be between `min` and `max`
- If `min` is provided, it must be before or equal to `max`

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
