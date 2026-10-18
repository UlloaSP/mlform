const number = (id, label, required = false, extra = {}) => ({
  id: id.replaceAll("_", "-"),
  kind: "number",
  label: `${label}${required ? " *" : ""}`,
  required,
  mappedTo: id,
  min: 0,
  step: 1e-8,
  ui: { input: "text" },
  ...extra,
});
const category = (id, label, options, required = false, extra = {}) => ({
  id: id.replaceAll("_", "-"),
  kind: "category",
  label: `${label}${required ? " *" : ""}`,
  required,
  mappedTo: id,
  options: options.map((option) =>
    typeof option === "string" ? option : { label: option[0], value: option[1] },
  ),
  ...extra,
});
const yesNo = [
  ["No", "0"],
  ["Yes", "1"],
];
const conditional = (mode) => ({
  hiddenWhen: { kind: "field-value", field: "predict-with", notEquals: mode },
  inactiveFieldPolicy: "omit",
});

export const DOSETAILOR_SCHEMA = {
  fields: [
    number("age", "Age", true, { min: 18, max: 100, step: 1 }),
    category(
      "gender",
      "Gender",
      [
        ["Male", "0"],
        ["Female", "1"],
      ],
      true,
    ),
    category(
      "race",
      "Race",
      [
        ["White", "white"],
        ["Black", "black"],
        ["Latin", "latin"],
        ["Asian", "asian"],
        ["Other", "other"],
      ],
      true,
    ),
    number("weight", "Weight (kg)", true, { min: 1e-8 }),
    number("height", "Height (cm)", true, { min: 1e-8 }),
    category("state", "Clinical Setting", [
      ["Home", "0"],
      ["Hospital", "1"],
      ["ICU", "2"],
    ]),
    number("creatinine", "Creatinine (mg/dL)"),
    number("albumin", "Albumin (g/dL)"),
    number("bilirubin", "Bilirubin (mg/dL)"),
    number("ast", "AST (U/L)"),
    number("alt", "ALT (U/L)"),
    number("sodium", "Sodium (mEq/L)"),
    number("potassium", "Potassium (mEq/L)"),
    number("hemoglobin", "Hemoglobin (g/dL)"),
    number("hematocrit", "Hematocrit (%)", false, { max: 100 }),
    category("pgp_inhibit", "P-gp Inhibit", yesNo, false, {
      description: "Concomitant P-glycoprotein inhibitor.",
    }),
    category("pgp_induce", "P-gp Induce", yesNo, false, {
      description: "Concomitant P-glycoprotein inducer.",
    }),
    category("cyp3a4_inhibit", "CYP3A4/5 Inhibit", yesNo, false, {
      description: "Concomitant CYP3A4/5 inhibitor.",
    }),
    category("cyp3a4_induce", "CYP3A4/5 Induce", yesNo, false, {
      description: "Concomitant CYP3A4/5 inducer.",
    }),
    category(
      "formulation",
      "Formulation",
      [
        ["Accord", "accord"],
        ["Adoport", "adoport"],
        ["Advagraf", "advagraf"],
        ["American Health", "american_health"],
        ["Dr. Ready", "dr_ready"],
        ["Envarsus", "envarsus"],
        ["Prograf", "prograf"],
        ["Solution", "solution"],
      ],
      true,
    ),
    category(
      "route",
      "Administration Route",
      [
        ["Oral", "0"],
        ["Sublingual", "1"],
      ],
      true,
    ),
    category("doses_per_24_hrs", "Doses per 24 hrs", ["1", "2", "3", "4"], true),
    number("level_dose_timediff", "Level Dose Time Difference (days)", true, {
      description:
        "The time difference between giving the tacrolimus dose and measuring the level (in days).",
    }),
    number("treatment_days", "Treatment Days", true, {
      step: 1,
      description: "Time since the start of the tacrolimus treatment (in days).",
    }),
    number("previous_dose", "Previous Dose (mg)", true),
    number("previous_level", "Previous Level (ng/ml)", true),
    number("previous_level_timediff", "Previous Level Time Difference (days)", true, {
      description: "Time since the previous tacrolimus level measurement (in days).",
    }),
    category(
      "predict_with",
      "Type",
      [
        ["Level Prediction", "dose"],
        ["Optimal dose recommendation", "level"],
      ],
      true,
      { defaultValue: "dose", label: "Type" },
    ),
    number("dose", "Dose (mg)", true, { ...conditional("dose"), min: 1e-8 }),
    number("level", "Target Level (ng/ml)", true, { ...conditional("level"), min: 1e-8 }),
  ],
  reports: [
    {
      id: "prediction",
      kind: "dosetailor-prediction",
      label: "Model Prediction",
      mappedTo: "prediction",
    },
  ],
};

export const DOSETAILOR_SECTIONS = [
  { title: "Demographics", fields: ["age", "gender", "race", "weight", "height", "state"] },
  {
    title: "Blood test",
    fields: [
      "creatinine",
      "albumin",
      "bilirubin",
      "ast",
      "alt",
      "sodium",
      "potassium",
      "hemoglobin",
      "hematocrit",
    ],
  },
  {
    title: "Concomitant drugs",
    columns: 4,
    fields: ["pgp_inhibit", "pgp_induce", "cyp3a4_inhibit", "cyp3a4_induce"],
  },
  {
    title: "Drug-Specific Parameters",
    fields: ["formulation", "route", "doses_per_24_hrs", "level_dose_timediff", "treatment_days"],
  },
  {
    title: "Previous Dose Information",
    fields: ["previous_dose", "previous_level", "previous_level_timediff"],
  },
  { title: "Prediction Type", fields: ["predict_with", "dose", "level"] },
].map((section) => ({ ...section, fields: section.fields.map((id) => id.replaceAll("_", "-")) }));

export const toDoseTailorFormValues = (values) =>
  Object.fromEntries(Object.entries(values).map(([id, value]) => [id.replaceAll("_", "-"), value]));

export const DOSETAILOR_LAYOUT = {
  kind: "stacked",
  children: [
    ...DOSETAILOR_SECTIONS.map((section, index) => ({
      kind: "section",
      id: `patient-section-${index}`,
      title: section.title,
      defaultOpen: true,
      children: [
        {
          kind: "group",
          columns: section.columns === 4 ? 2 : 3,
          children:
            section.columns === 4
              ? [section.fields.slice(0, 2), section.fields.slice(2)].map((fields) => ({
                  kind: "group",
                  columns: 2,
                  children: fields.map((field) => ({ kind: "field", field })),
                }))
              : section.fields.map((field) => ({ kind: "field", field })),
        },
      ],
    })),
    {
      kind: "section",
      id: "prediction-results",
      title: "Model Prediction",
      defaultOpen: true,
      children: [{ kind: "report", report: "prediction" }],
    },
  ],
};

// Original public examples, inspected at https://dosetailor.com/tacrolimusv1.
export const DOSETAILOR_EXAMPLES = [
  {
    id: "example-1",
    label: "Example 1",
    values: {
      age: 75,
      gender: "0",
      race: "white",
      weight: 89,
      height: 169,
      state: "1",
      ast: 30,
      alt: 45,
      bilirubin: 2,
      albumin: 6,
      creatinine: 1.2,
      sodium: 139,
      potassium: 4.2,
      hemoglobin: 12,
      hematocrit: 40,
      pgp_inhibit: "0",
      pgp_induce: "1",
      cyp3a4_inhibit: "1",
      cyp3a4_induce: "0",
      formulation: "prograf",
      route: "0",
      dose: 0,
      level: 8,
      doses_per_24_hrs: "1",
      level_dose_timediff: 1,
      treatment_days: 200,
      previous_dose: 5,
      previous_level: 7,
      previous_level_timediff: 7,
      predict_with: "level",
    },
  },
  {
    id: "example-2",
    label: "Example 2",
    values: {
      age: 58,
      gender: "1",
      race: "black",
      weight: 80,
      height: 175,
      state: "0",
      ast: 40,
      alt: 50,
      bilirubin: 1.2,
      albumin: 4,
      creatinine: 1.9,
      sodium: 142,
      potassium: 4.4,
      hemoglobin: 11,
      hematocrit: 30,
      pgp_inhibit: "0",
      pgp_induce: "0",
      cyp3a4_inhibit: "0",
      cyp3a4_induce: "0",
      formulation: "adoport",
      route: "0",
      dose: 0,
      level: 10,
      doses_per_24_hrs: "2",
      level_dose_timediff: 1,
      treatment_days: 500,
      previous_dose: 1,
      previous_level: 9,
      previous_level_timediff: 50,
      predict_with: "level",
    },
  },
];
