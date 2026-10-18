export const BIOCHEMISTRY_PA_MODEL = "Mejor Toda Bioquimica PA";

// Explicit input offsets from the supplied model contract. Values are demonstration observations.
export const BIOCHEMISTRY_PA_PARAMETERS = [
  { id: "anion-gap", name: "Anion GAP", label: "Anion GAP", offset: 0, values: [10, 12, 14] },
  { id: "bicarbonate", name: "Bicarbonate", label: "Bicarbonate", offset: 6, values: [22, 24, 26] },
  { id: "chloride", name: "Chloride", label: "Chloride", offset: 12, values: [100, 102, 104] },
  { id: "creatinine", name: "Creatinine", label: "Creatinine", offset: 18, values: [0.8, 1, 1.2] },
  { id: "glucose", name: "Glucose", label: "Glucose", offset: 24, values: [90, 100, 110] },
  { id: "hematocrit", name: "Hematocrit", label: "Hematocrit", offset: 30, values: [36, 38, 40] },
  { id: "hemoglobin", name: "Hemoglobin", label: "Hemoglobin", offset: 36, values: [12, 13, 14] },
  { id: "potassium", name: "Potassium", label: "Potassium", offset: 42, values: [3.8, 4, 4.2] },
  { id: "sodium", name: "Sodium", label: "Sodium", offset: 48, values: [136, 138, 140] },
  {
    id: "urea-nitrogen",
    name: "Urea Nitrogen",
    label: "Urea Nitrogen",
    offset: 54,
    values: [12, 15, 18],
  },
  { id: "mch", name: "MCH", label: "MCH", offset: 60, values: [27, 29, 31] },
  { id: "mchc", name: "MCHC", label: "MCHC", offset: 66, values: [31, 32, 33] },
  { id: "mcv", name: "MCV", label: "MCV", offset: 72, values: [85, 90, 95] },
  {
    id: "platelet-count",
    name: "Platelet Count",
    label: "Platelet Count",
    offset: 78,
    values: [180, 200, 220],
  },
  { id: "rdw", name: "RDW", label: "RDW", offset: 84, values: [12, 13, 14] },
  {
    id: "red-blood-cells",
    name: "Red Blood Cells",
    label: "Red Blood Cells",
    offset: 90,
    values: [4, 4.5, 5],
  },
  {
    id: "white-blood-cells",
    name: "White Blood Cells",
    label: "White Blood Cells",
    offset: 96,
    values: [5, 6, 7],
  },
];

const labStatistics = [
  { suffix: "mean", operation: "mean" },
  { suffix: "sd", operation: "stddev", ddof: 1 },
  { suffix: "min", operation: "min" },
  { suffix: "max", operation: "max" },
  { suffix: "q1", operation: "quantile", q: 0.25, method: "linear" },
  { suffix: "q3", operation: "quantile", q: 0.75, method: "linear" },
];

// Blood pressure has a different feature order: mean, sd, q1, q3, min, max.
const pressureStatistics = [
  labStatistics[0],
  labStatistics[1],
  labStatistics[4],
  labStatistics[5],
  labStatistics[2],
  labStatistics[3],
];

const aggregates = (name, source, offset, statistics) =>
  statistics.map(({ suffix, ...calculation }, index) => ({
    label: `${name}_${suffix}`,
    source,
    ...calculation,
    mappedTo: { [BIOCHEMISTRY_PA_MODEL]: offset + index },
  }));

export const BIOCHEMISTRY_PA_SCHEMA = {
  fields: [
    ...BIOCHEMISTRY_PA_PARAMETERS.map(({ id, name, label, offset, values }) => ({
      id,
      kind: "series",
      label,
      description: `Enter each recorded ${label} value. At least two complete observations are required.`,
      displayKey: label,
      required: true,
      minPoints: 2,
      showAggregationSummary: false,
      columns: [{ id: "value", kind: "number", label: "Value", step: 1e-8, required: true }],
      defaultValue: values.map((value) => ({ value })),
      aggregations: aggregates(name, "value", offset, labStatistics),
    })),
    {
      id: "blood-pressure",
      kind: "series",
      label: "Blood pressure",
      description:
        "Enter systolic and diastolic values in mmHg for each measurement. The date is optional; at least two complete measurements are required.",
      displayKey: "Blood pressure",
      required: true,
      minPoints: 2,
      showAggregationSummary: false,
      columns: [
        { id: "date", kind: "date", label: "Date (optional)" },
        {
          id: "systolic",
          kind: "number",
          label: "Systolic",
          step: 1e-8,
          required: true,
          unit: "mmHg",
        },
        {
          id: "diastolic",
          kind: "number",
          label: "Diastolic",
          step: 1e-8,
          required: true,
          unit: "mmHg",
        },
      ],
      defaultValue: [
        { date: "2026-10-01", systolic: 120, diastolic: 70 },
        { date: "2026-10-02", systolic: 130, diastolic: 80 },
        { date: "2026-10-03", systolic: 140, diastolic: 90 },
      ],
      aggregations: [
        ...aggregates("bp_s", "systolic", 102, pressureStatistics),
        ...aggregates("bp_d", "diastolic", 108, pressureStatistics),
      ],
    },
  ],
  reports: [
    {
      id: "clinical-classifier",
      kind: "classifier",
      label: `Predicted class · ${BIOCHEMISTRY_PA_MODEL}`,
      description: "Simulated classification for this demonstration.",
      labels: ["0", "1"],
      mappedTo: { [BIOCHEMISTRY_PA_MODEL]: "classifier" },
      showClassProbabilities: true,
    },
  ],
};

export const BIOCHEMISTRY_PA_FEATURES = BIOCHEMISTRY_PA_SCHEMA.fields
  .flatMap((field) =>
    field.aggregations.map((aggregation) => ({
      index: aggregation.mappedTo[BIOCHEMISTRY_PA_MODEL],
      label: aggregation.label,
    })),
  )
  .sort((a, b) => a.index - b.index);

const fields = (ids) => ids.map((field) => ({ kind: "field", field }));
const chemistry = [
  "anion-gap",
  "bicarbonate",
  "chloride",
  "creatinine",
  "glucose",
  "potassium",
  "sodium",
  "urea-nitrogen",
];
const hematology = BIOCHEMISTRY_PA_PARAMETERS.filter(({ id }) => !chemistry.includes(id)).map(
  ({ id }) => id,
);

export const BIOCHEMISTRY_PA_LAYOUT = {
  kind: "tabs",
  tabs: [
    { id: "chemistry", title: "Biochemistry", children: fields(chemistry) },
    { id: "hematology", title: "Hematology", children: fields(hematology) },
    { id: "pressure", title: "Blood pressure", children: fields(["blood-pressure"]) },
    {
      id: "result",
      title: "Result",
      children: [{ kind: "report", report: "clinical-classifier" }],
    },
  ],
};
