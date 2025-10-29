// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import React from 'react';
import styles from './FeatureCard.module.css';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  link?: string;
}

export default function FeatureCard({ 
  icon, 
  title, 
  description, 
  link 
}: FeatureCardProps): React.ReactElement {
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className={styles.card}>
      {children}
    </div>
  );

  const content = (
    <>
      <div className={styles.icon}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </>
  );

  if (link) {
    return (
      <a href={link} className={styles.cardLink}>
        <Card>{content}</Card>
      </a>
    );
  }

  return <Card>{content}</Card>;
}
