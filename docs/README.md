# MLForm Documentation

Official documentation site for MLForm, built with [Docusaurus](https://docusaurus.io/).

## 📁 Structure

```
docs/
├── docs/                   # Documentation markdown files
│   ├── intro.md           # Introduction page
│   ├── getting-started/   # Installation and quick start
│   ├── api/               # API reference
│   └── examples/          # Code examples
├── blog/                  # Blog posts
├── src/
│   ├── components/        # React components
│   ├── css/              # Custom styles
│   └── pages/            # Custom pages
├── static/               # Static assets
└── docusaurus.config.ts  # Docusaurus configuration
```

## 🚀 Development

### Prerequisites

- Node.js >= 22.14.0
- npm >= 11.5.1

### Installation

```bash
npm install
```

### Local Development

```bash
npm run start
```

This command starts a local development server at `http://localhost:3000`. Most changes are reflected live without having to restart the server.

### Build

```bash
npm run build
```

This command generates static content into the `build` directory.

### Serve Production Build

```bash
npm run serve
```

## 📝 Writing Documentation

### Create a New Doc

Create a new `.md` or `.mdx` file in the appropriate directory with frontmatter:

```markdown
---
sidebar_position: 1
title: My Page Title
---

# Content here
```

### Code Blocks

Use fenced code blocks with language specification:

````markdown
```typescript
import { MLForm } from 'mlform';
const form = new MLForm('https://api.example.com');
```
````

## 📦 Deployment

The documentation is automatically deployed to GitHub Pages when:

1. Changes are pushed to the `main` branch
2. CI/CD pipeline completes successfully
3. A GitHub release is created

The site is available at: https://ulloasp.github.io/mlform/

## 🤝 Contributing

When contributing to the documentation:

1. Follow the existing structure
2. Use clear, concise language
3. Include code examples
4. Test locally before committing

## 📄 License

MIT License - Part of the MLForm project
