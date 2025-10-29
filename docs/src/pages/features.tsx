// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import FeatureCard from '@site/src/components/FeatureCard';
import Layout from '@theme/Layout';
import React from 'react';
import styles from './features.module.css';

const features = [
  {
    icon: '🎯',
    title: 'Type-Safe',
    description: 'Full TypeScript support with automatic type inference and validation using Zod schemas.',
  },
  {
    icon: '🚀',
    title: 'Dynamic Forms',
    description: 'Generate forms from JSON schemas with automatic rendering and validation.',
  },
  {
    icon: '🤖',
    title: 'ML Integration',
    description: 'Built-in support for classification and regression models with real-time predictions.',
  },
  {
    icon: '⚡',
    title: 'Web Components',
    description: 'Built with Lit for lightweight, performant, and framework-agnostic components.',
  },
  {
    icon: '🔧',
    title: 'Extensible',
    description: 'Create custom field types and model strategies to fit your specific needs.',
  },
  {
    icon: '📊',
    title: 'Rich Field Types',
    description: 'Text, number, boolean, category, and date fields with comprehensive validation.',
  },
  {
    icon: '🎨',
    title: 'Customizable',
    description: 'Full control over styling and behavior through CSS custom properties.',
  },
  {
    icon: '📱',
    title: 'Responsive',
    description: 'Mobile-first design that works seamlessly across all device sizes.',
  },
  {
    icon: '🔒',
    title: 'Secure',
    description: 'Built-in XSS protection and input sanitization for safe user data handling.',
  },
  {
    icon: '⚙️',
    title: 'Zero Config',
    description: 'Works out of the box with sensible defaults and minimal setup required.',
  },
  {
    icon: '🌐',
    title: 'i18n Ready',
    description: 'Internationalization support for building multi-language applications.',
  },
  {
    icon: '📦',
    title: 'Small Bundle',
    description: 'Optimized bundle size with tree-shaking support for minimal footprint.',
  },
];

export default function Features(): React.ReactElement {
  return (
    <Layout
      title="Features"
      description="Explore all the powerful features of MLForm">
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1>Powerful Features</h1>
          <p className={styles.subtitle}>
            Everything you need to build dynamic forms with ML capabilities
          </p>
        </div>

        <div className={styles.features}>
          {features.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} />
          ))}
        </div>

        <div className={styles.cta}>
          <h2>Ready to get started?</h2>
          <p>Install MLForm and start building in minutes</p>
          <div className={styles.buttons}>
            <a href="/docs/getting-started/installation" className={styles.primaryButton}>
              Get Started
            </a>
            <a href="/docs/examples/basic-form" className={styles.secondaryButton}>
              View Examples
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
