---
sidebar_position: 1
---

# Installation

Get MLForm up and running in your project.

## Requirements

Before installing MLForm, make sure you have:

- **Node.js** >= 22.14.0
- **npm** >= 11.5.1 (or yarn/pnpm equivalent)

## Install via npm

Install MLForm using your preferred package manager:

```bash
npm install mlform
```

Or using yarn:

```bash
yarn add mlform
```

Or using pnpm:

```bash
pnpm add mlform
```

## Package Exports

MLForm provides multiple entry points for different use cases:

### Main Package

```typescript
import { MLForm } from 'mlform';
```

### Extensions

Access base classes and interfaces:

```typescript
import { BaseField, BaseModel } from 'mlform/extensions';
```

### Strategies

Import field and model type enums:

```typescript
import { FieldTypes, ModelTypes } from 'mlform/strategies';
```

## TypeScript Support

MLForm is written in TypeScript and includes type definitions out of the box. No need to install additional `@types` packages.

```typescript
import { MLForm } from 'mlform';
import type { Signature } from 'mlform';

const form = new MLForm('https://api.example.com');
```

## Browser Support

MLForm uses modern Web Components (Lit) and requires:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Or any browser with Web Components support

## CDN Usage

For quick prototyping, you can use MLForm via CDN:

```html
<script type="module">
  import { MLForm } from 'https://esm.sh/mlform';
  
  const form = new MLForm('https://api.example.com');
  // Your code here
</script>
```

:::caution
CDN usage is recommended only for prototyping. For production, use a proper build system.
:::

## Verification

Verify your installation:

```typescript
import { MLForm } from 'mlform';

const form = new MLForm('https://api.example.com');
console.log('MLForm installed successfully!');
```

## Next Steps

Now that you have MLForm installed:

- 🚀 Follow the [Quick Start](./quick-start) guide
- 📖 Learn about [Field Types](../guides/field-types)
- 💡 Check out [Examples](../examples/basic-form)
