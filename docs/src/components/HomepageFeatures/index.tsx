// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import Heading from '@theme/Heading';
import clsx from 'clsx';
import type {ReactNode} from 'react';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: '🚀 Dynamic Forms',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Create dynamic, type-safe forms from JSON schemas with built-in validation.
        Support for text, number, boolean, category, and date fields out of the box.
      </>
    ),
  },
  {
    title: '🤖 ML Integration',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Seamlessly integrate machine learning models for classification and regression.
        Real-time predictions with execution time tracking and configurable backends.
      </>
    ),
  },
  {
    title: '⚡ Web Components',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Built with Lit for modern, lightweight web components. Fully typed with TypeScript
        and extensible through custom strategies and descriptors.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
