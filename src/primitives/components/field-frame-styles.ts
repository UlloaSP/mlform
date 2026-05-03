// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";

export const fieldFrameStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  .tile {
    position: relative;
    display: grid;
    gap: 0.85rem;
    overflow: hidden;
    padding: 1.5rem 2rem;
    border-radius: var(--mlf-field-radius, 12px);
    border: var(--mlf-border-width, 1px) solid
      var(--mlf-field-border, var(--mlf-color-border, #e2e8f0));
    background: var(--mlf-field-bg, var(--mlf-color-surface, #ffffff));
    box-shadow: 0 4px 12px var(--mlf-field-shadow, rgba(0, 0, 0, 0.04));
    transition: box-shadow 0.2s ease;
  }

  .tile:hover {
    box-shadow: 0 6px 18px var(--mlf-field-shadow-hover, rgba(0, 0, 0, 0.06));
  }

  .tile::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 6px;
    background: var(--mlf-field-accent, var(--mlf-color-accent, #1e40af));
    transition: background 0.2s ease;
  }

  .tile.success::before {
    background: var(--mlf-field-accent-success, var(--mlf-color-success, #059669));
  }

  .tile.error::before {
    background: var(--mlf-field-accent-error, var(--mlf-color-danger, #dc2626));
  }

  .header {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 1rem;
    min-width: 0;
  }

  .label {
    margin: 0;
    min-width: 0;
    color: var(--mlf-field-label-color, var(--mlf-color-text, #0f172a));
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }

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

  .help-btn:disabled {
    background: var(--mlf-help-btn-bg-disabled, var(--mlf-color-text-muted, #475569));
    cursor: not-allowed;
    opacity: 0.7;
  }

  .description {
    display: none;
    min-width: 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--mlf-field-description-color, var(--mlf-color-secondary, #475569));
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .description.show {
    display: block;
  }

  .control-slot {
    min-width: fit-content;
  }

  .feedback {
    min-width: 0;
    font-size: 0.8rem;
    line-height: 1.5;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .feedback.success {
    color: var(--mlf-field-feedback-success, var(--mlf-color-success, #059669));
  }

  .feedback.error {
    color: var(--mlf-field-feedback-error, var(--mlf-color-danger, #dc2626));
  }
`;
