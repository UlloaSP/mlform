---
slug: introducing-mlform
title: Introducing MLForm
authors: [ulloasp]
tags: [mlform, release, announcement]
---

# Introducing MLForm

We're excited to announce the release of **MLForm** - a powerful framework for creating dynamic forms with built-in machine learning capabilities.

<!-- truncate -->

## What is MLForm?

MLForm bridges the gap between traditional form builders and modern ML-powered applications. It allows developers to:

- **Build dynamic forms** from JSON schemas
- **Integrate ML models** seamlessly for real-time predictions
- **Ensure type safety** with full TypeScript support
- **Extend easily** through custom strategies

## Why We Built MLForm

Traditional form libraries are great for collecting user input, but integrating machine learning predictions often requires significant custom code. We wanted to create a solution that makes ML integration as easy as defining a schema.

## Key Features

### 1. Schema-Driven Forms

Define your forms using simple JSON:

```typescript
const schema = {
  inputs: [
    { type: 'text', title: 'Name', required: true },
    { type: 'number', title: 'Age', min: 0, max: 120 }
  ],
  outputs: [
    { type: 'classifier', title: 'Risk Category' }
  ]
};
```

### 2. Built-in ML Support

MLForm natively supports classification and regression models:

```typescript
const mlForm = new MLForm('https://api.example.com/predict');
mlForm.onSubmit((inputs, response) => {
  console.log('Prediction:', response.prediction);
  console.log('Confidence:', response.confidence);
});
```

### 3. Type Safety

Full TypeScript support ensures you catch errors at compile time:

```typescript
import { MLForm } from 'mlform';
import type { Signature, Output } from 'mlform';
```

### 4. Web Components

Built with Lit for maximum compatibility and performance.

## Getting Started

Install MLForm:

```bash
npm install mlform
```

Create your first form:

```typescript
import { MLForm } from 'mlform';

const form = new MLForm('https://api.example.com');
await form.toHTMLElement(schema, container);
```

## What's Next

We have exciting features planned:

- 🎨 **Theming system** - Easy customization
- 🌐 **i18n support** - Multi-language forms
- 📊 **Built-in visualization** - Charts and graphs
- 🔌 **Plugin system** - Third-party extensions

## Try It Today

Check out our [documentation](/docs/intro) and start building ML-powered forms today!

---

Follow our progress on [GitHub](https://github.com/UlloaSP/mlform) and join the discussion!
