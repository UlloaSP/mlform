export default `
:host {
					display: block;
				}

				.wrap {
					display: grid;
					gap: 1rem;
				}

				.summary {
					padding: 0.9rem 1rem;
					border: 1px solid color-mix(in srgb, var(--mlf-color-border, #e2e8f0) 88%, transparent);
					border-radius: 1rem;
					background: color-mix(in srgb, var(--mlf-color-accent, #1e40af) 7%, transparent);
					color: var(--mlf-color-text, #0f172a);
				}

				.summary strong {
					font-size: 0.95rem;
				}

				.error,
				.empty {
					padding: 0.9rem 1rem;
					border-radius: 1rem;
					line-height: 1.5;
				}

				.error {
					color: var(--mlf-color-danger, #dc2626);
					border: 1px solid color-mix(in srgb, var(--mlf-color-danger, #dc2626) 25%, transparent);
				}

				.empty {
					border: 1px dashed var(--mlf-color-border, #cbd5e1);
					color: var(--mlf-color-text-muted, #475569);
				}

				.grid {
					display: grid;
					gap: 0.9rem;
					grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
				}

				.card {
					display: grid;
					gap: 0.9rem;
					padding: 1rem;
					border-radius: 1rem;
					border: 1px solid color-mix(in srgb, var(--mlf-color-border, #e2e8f0) 90%, transparent);
					background: color-mix(in srgb, var(--mlf-color-surface, #ffffff) 92%, transparent);
				}

				.card.best {
					border-color: color-mix(in srgb, var(--mlf-color-success, #059669) 35%, transparent);
					box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--mlf-color-success, #059669) 18%, transparent);
				}

				.card-header {
					display: flex;
					align-items: start;
					justify-content: space-between;
					gap: 0.75rem;
				}

				.card-header h3,
				.card-header p {
					margin: 0;
				}

				.card-header h3 {
					font-size: 1rem;
				}

				.card-header p {
					margin-top: 0.2rem;
					color: var(--mlf-color-text-muted, #475569);
					font-size: 0.8rem;
					text-transform: uppercase;
					letter-spacing: 0.08em;
				}

				.badge {
					padding: 0.3rem 0.55rem;
					border-radius: 999px;
					background: color-mix(in srgb, var(--mlf-color-success, #059669) 16%, transparent);
					color: var(--mlf-color-success, #059669);
					font-size: 0.72rem;
					font-weight: 700;
					letter-spacing: 0.06em;
					text-transform: uppercase;
					white-space: nowrap;
				}

				.metrics {
					display: grid;
					gap: 0.75rem;
					margin: 0;
				}

				.metrics div {
					display: grid;
					gap: 0.15rem;
				}

				dt {
					color: var(--mlf-color-text-muted, #475569);
					font-size: 0.75rem;
					font-weight: 700;
					letter-spacing: 0.06em;
					text-transform: uppercase;
				}

				dd {
					margin: 0;
					color: var(--mlf-color-text, #0f172a);
					font-size: 0.95rem;
					font-weight: 600;
				}
`;
