import type { MountFormOptions } from "mlform/kit";
import type { FormViewSnapshot } from "mlform/view";

export interface ClinicalDemoConfig extends Pick<
  MountFormOptions,
  | "schema"
  | "transport"
  | "plugins"
  | "layout"
  | "primitiveRegistry"
  | "primitiveText"
  | "initialValues"
> {
  className: string;
  shell: string;
  examples: { id: string; label: string; values: Record<string, unknown> }[];
  examplePlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
  validationLabel: string;
  failureLabel: string;
  staleLabel?: string;
  emptyTitle: string;
  emptyBody: string;
  resultTitle?: string;
  sections?: { title: string; columns?: 1 | 2 | 3; fields: string[] }[];
  toFormValues?(values: Record<string, unknown>): Record<string, unknown>;
  getStatus(snapshot: FormViewSnapshot): string;
  onSnapshot?(page: HTMLElement, snapshot: FormViewSnapshot): void;
}
