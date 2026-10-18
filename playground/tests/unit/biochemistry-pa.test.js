import assert from "node:assert/strict";
import { test } from "node:test";
import { createForm, createSubmissionSnapshot } from "mlform/runtime";
import { createBuiltinMlRegistry } from "mlform/builtins";
import {
  BIOCHEMISTRY_PA_MODEL,
  BIOCHEMISTRY_PA_SCHEMA,
} from "../../src/playground/biochemistry-pa-schema.js";

const prefixes = [
  "Anion GAP",
  "Bicarbonate",
  "Chloride",
  "Creatinine",
  "Glucose",
  "Hematocrit",
  "Hemoglobin",
  "Potassium",
  "Sodium",
  "Urea Nitrogen",
  "MCH",
  "MCHC",
  "MCV",
  "Platelet Count",
  "RDW",
  "Red Blood Cells",
  "White Blood Cells",
];
const featureLabels = [
  ...prefixes.flatMap((prefix) =>
    ["mean", "sd", "min", "max", "q1", "q3"].map((suffix) => `${prefix}_${suffix}`),
  ),
  ...["bp_s", "bp_d"].flatMap((prefix) =>
    ["mean", "sd", "q1", "q3", "min", "max"].map((suffix) => `${prefix}_${suffix}`),
  ),
];

// Independent expected features for three equally spaced observations: sample sd equals their spacing.
const expected = [
  [12, 2, 10, 14, 11, 13],
  [24, 2, 22, 26, 23, 25],
  [102, 2, 100, 104, 101, 103],
  [1, 0.2, 0.8, 1.2, 0.9, 1.1],
  [100, 10, 90, 110, 95, 105],
  [38, 2, 36, 40, 37, 39],
  [13, 1, 12, 14, 12.5, 13.5],
  [4, 0.2, 3.8, 4.2, 3.9, 4.1],
  [138, 2, 136, 140, 137, 139],
  [15, 3, 12, 18, 13.5, 16.5],
  [29, 2, 27, 31, 28, 30],
  [32, 1, 31, 33, 31.5, 32.5],
  [90, 5, 85, 95, 87.5, 92.5],
  [200, 20, 180, 220, 190, 210],
  [13, 1, 12, 14, 12.5, 13.5],
  [4.5, 0.5, 4, 5, 4.25, 4.75],
  [6, 1, 5, 7, 5.5, 6.5],
  [130, 10, 125, 135, 120, 140],
  [80, 10, 75, 85, 70, 90],
].flat();

const makeForm = (submit = async () => ({ reports: [] })) =>
  createForm({
    registry: createBuiltinMlRegistry(),
    schema: BIOCHEMISTRY_PA_SCHEMA,
    transport: { submit },
  });

await test("keeps the supplied model's exact 114 feature positions and classifier mapping", () => {
  assert.equal(BIOCHEMISTRY_PA_SCHEMA.fields.length, 18);
  const aggregations = BIOCHEMISTRY_PA_SCHEMA.fields.flatMap((field) => field.aggregations);
  assert.equal(aggregations.length, 114);
  for (const [index, aggregation] of aggregations.entries()) {
    assert.equal(aggregation.label, featureLabels[index]);
    assert.deepEqual(aggregation.mappedTo, { [BIOCHEMISTRY_PA_MODEL]: index });
    if (aggregation.operation === "stddev") assert.equal(aggregation.ddof, 1);
  }
  for (const field of BIOCHEMISTRY_PA_SCHEMA.fields) {
    assert.equal(field.showAggregationSummary, false);
    assert.equal(field.minPoints, 2);
    assert.equal(field.mappedTo, undefined);
  }
  assert.deepEqual(BIOCHEMISTRY_PA_SCHEMA.reports[0].mappedTo, {
    [BIOCHEMISTRY_PA_MODEL]: "classifier",
  });
  assert.deepEqual(BIOCHEMISTRY_PA_SCHEMA.reports[0].labels, ["0", "1"]);
});

await test("computes all 114 numeric model inputs and retains 18 original series", async () => {
  const form = makeForm();
  assert.equal((await form.validate()).valid, true);
  for (const backend of [undefined, BIOCHEMISTRY_PA_MODEL]) {
    const snapshot = createSubmissionSnapshot(form, { backend });
    assert.equal(Object.keys(snapshot.modelValues).length, 114);
    expected.forEach((value, index) =>
      assert.ok(
        Math.abs(snapshot.modelValues[index] - value) < 1e-10,
        `${index}: ${featureLabels[index]}`,
      ),
    );
    assert.equal(Object.keys(snapshot.displayValues).length, 18);
    assert.equal(snapshot.displayValues["Anion GAP"].length, 3);
    assert.equal(snapshot.displayValues["Anion GAP"][0].value, 10);
  }
  assert.deepEqual(createSubmissionSnapshot(form, { backend: "Other model" }).modelValues, {});
  form.dispose();
});

await test("recalculates edits and blocks incomplete or insufficient observations before sending", async () => {
  let calls = 0;
  const form = makeForm(async () => {
    calls += 1;
    return { reports: [] };
  });
  form.setValues({ "anion-gap": [{ value: 10 }, { value: 20 }] });
  await form.submit({ backend: BIOCHEMISTRY_PA_MODEL });
  assert.equal(calls, 1);
  const values = createSubmissionSnapshot(form, { backend: BIOCHEMISTRY_PA_MODEL }).modelValues;
  assert.equal(values[0], 15);
  assert.ok(Math.abs(values[1] - Math.sqrt(50)) < 1e-10);
  assert.equal(values[2], 10);
  assert.equal(values[3], 20);
  assert.equal(values[4], 12.5);
  assert.equal(values[5], 17.5);
  form.setValues({ "anion-gap": [{ value: 10 }] });
  await assert.rejects(form.submit(), { name: "ValidationError" });
  form.setValues({ "anion-gap": [{ value: 10 }, { value: null }] });
  await assert.rejects(form.submit(), { name: "ValidationError" });
  assert.equal(calls, 1);
  form.dispose();
});
