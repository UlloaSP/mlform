export interface Specimen {
  /** Capture name in src/assets, without the mode suffix. */
  capture: string;
  kind: string;
  /** Shown only when the capture alone cannot explain the behavior. */
  note?: string;
  /** Spans two grid rows because the capture holds the field it updates. */
  tall?: boolean;
  alt: string;
}

// Ordered so the three-column grid fills without gaps; the tall tile takes rows one and two.
export const specimens: Specimen[] = [
  { capture: "field-text", kind: "text", alt: "A text input named Station name." },
  {
    capture: "field-invalid",
    kind: "number",
    note: "Validated as you type.",
    alt: "A humidity input with 140 percent and the error Maximum value is 100.",
  },
  {
    capture: "field-mapped-category",
    kind: "mapped-category",
    note: "Each option fills linked fields.",
    tall: true,
    alt: "A preset dropdown set to Detailed, 30 readings, above a read-only field showing 30 readings per hour.",
  },
  {
    capture: "field-range",
    kind: "number",
    note: "Optional, with min, max and a default: a slider.",
    alt: "A slider set to 75 percent.",
  },
  { capture: "field-category", kind: "category", alt: "A dropdown set to Outdoor." },
  {
    capture: "field-single-choice",
    kind: "single-choice",
    alt: "Three radio options with Next day selected.",
  },
  {
    capture: "field-multi-choice",
    kind: "multi-choice",
    alt: "Three checkboxes with Temperature and Humidity checked.",
  },
  {
    capture: "field-long-text",
    kind: "long-text",
    alt: "A multiline notes input with two lines of text.",
  },
  { capture: "field-boolean", kind: "boolean", alt: "A two-state toggle with Enabled selected." },
  { capture: "field-rating", kind: "rating", alt: "A rating scale from 1 to 5 set to 4." },
  { capture: "field-date", kind: "date", alt: "A date input set to 06/15/2026." },
];
