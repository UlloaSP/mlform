---
sidebar_position: 1
---

# Introduction

Welcome to **MLForm** - a powerful framework for creating dynamic forms with built-in machine learning capabilities.

## What is MLForm?

MLForm is a TypeScript-based framework that allows you to:

- 🎯 **Create dynamic forms** from JSON schemas with automatic validation
- 🤖 **Integrate ML models** for real-time predictions (classification & regression)
- 🧩 **Build with Web Components** using modern Lit framework
- 🔒 **Ensure type safety** with full TypeScript support
- ⚡ **Extend easily** through custom strategies and descriptors

## Key Features

### Dynamic Form Generation

Define your forms using JSON schemas and let MLForm handle the rendering:

```typescript
const formSchema = {
  inputs: [
    {
      type: "text",
      title: "Name",
      description: "Enter your full name",
      required: true
    },
    {
      type: "number",
      title: "Age",
      min: 0,
      max: 120,
      required: true
    }
  ],
  outputs: []
};
```

### Machine Learning Integration

Seamlessly integrate classification and regression models:

```typescript
const mlForm = new MLForm("https://api.example.com/predict");
await mlForm.toHTMLElement(schema, container);
```

### Type-Safe Field Types

Built-in support for multiple field types:
- `text` - Text input with validation
- `number` - Numeric input with min/max constraints
- `boolean` - Checkbox or toggle
- `category` - Select dropdown or radio buttons
- `date` - Date picker with format validation

### Extensible Architecture

Create custom field types and ML model strategies:

```typescript
class CustomFieldStrategy extends FieldStrategy {
  // Your custom implementation
}

mlForm.register(customFieldStrategy);
```

## Use Cases

MLForm is perfect for:

- **Data collection forms** with ML-powered validation
- **Predictive interfaces** that provide real-time insights
- **Survey applications** with dynamic question flows
- **Admin dashboards** with model integration
- **Interactive data entry** with instant feedback

## Next Steps

Ready to get started?

- 📚 Check the [Installation Guide](./getting-started/installation) to set up MLForm
- 🚀 Follow the [Quick Start](./getting-started/quick-start) tutorial
- 💡 Browse [Examples](./examples/basic-form) to see it in action
- 📖 Explore the [API Reference](./api/mlform) for detailed documentation

## Community & Support

- 🐛 [Report issues](https://github.com/UlloaSP/mlform/issues) on GitHub
- 💬 [Join discussions](https://github.com/UlloaSP/mlform/discussions)
- 📦 [View on npm](https://www.npmjs.com/package/mlform)

---

**MLForm** is open source and available under the MIT License.
