// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import React, { useState } from 'react';
import styles from './CodeBlock.module.css';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
}

export default function CodeBlock({ 
  code, 
  language = 'typescript', 
  title,
  showLineNumbers = true 
}: CodeBlockProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.codeBlock}>
      {title && (
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button 
            className={styles.copyButton}
            onClick={handleCopy}
            aria-label="Copy code"
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
      )}
      <pre className={styles.pre}>
        <code className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
}
