// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";

export const helpButtonStyles = css`
  .help-btn {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: var(--mlf-help-btn-bg, var(--mlf-color-accent, #1e40af));
    color: var(--mlf-help-btn-color, #ffffff);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .help-btn:hover:not(:disabled) {
    background: var(--mlf-help-btn-bg-hover, var(--mlf-color-accent-hover, #1d4ed8));
  }

  .help-btn:focus-visible {
    outline: 2px solid var(--mlf-focus-ring, var(--mlf-color-accent, #1e40af));
    outline-offset: 3px;
  }

  .help-btn:disabled {
    background: var(--mlf-help-btn-bg-disabled, var(--mlf-color-text-muted, #475569));
    cursor: not-allowed;
    opacity: 0.7;
  }

  @media (prefers-reduced-motion: reduce) {
    .help-btn {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .help-btn {
      border: 1px solid ButtonText;
    }
  }
`;
