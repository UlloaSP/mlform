import type { BloodPressureModel } from "../../src/clinical-demos/lab2pressure-model.ts";
import type { FormSchema } from "mlform/schema";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { createForm, createSubmissionSnapshot } from "mlform/runtime";
import { createBuiltinMlRegistry } from "mlform/builtins";
import { BP_MODEL, predictBloodPressure } from "../../src/clinical-demos/lab2pressure-model.ts";
import {
  DOSETAILOR_SCHEMA,
  DOSETAILOR_EXAMPLES,
  toDoseTailorFormValues,
} from "../../src/clinical-demos/dosetailor-schema.ts";
import {
  createDoseTailorRequest,
  createDoseTailorTransport,
  normalizeDoseTailorResponse,
} from "../../src/clinical-demos/dosetailor-transport.ts";

const json = <T>(path: string): T =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

await test("Best BP Minimal matches 72 native CatBoost predictions including float32 border cases", () => {
  const model = json<BloodPressureModel & { leavesSha256: string; bundleSha256: string }>(
    "../../public/models/best-bp-minimal.json",
  );
  const binary = readFileSync(new URL("../../public/models/best-bp-minimal.bin", import.meta.url));
  const leaves = new Float64Array(binary.buffer, binary.byteOffset, binary.byteLength / 8);
  const fixtures = json<{ rows: number[][]; probabilities: number[][]; bundleSha256: string }>(
    "../fixtures/best-bp-minimal.json",
  );
  assert.equal(createHash("sha256").update(binary).digest("hex"), model.leavesSha256);
  assert.equal(fixtures.bundleSha256, model.bundleSha256);
  for (const [index, row] of fixtures.rows.entries()) {
    const values = Object.fromEntries(model.featureOrder.map((key, column) => [key, row[column]]));
    const result = predictBloodPressure(model, leaves, values);
    result.probabilities.forEach((probability, column) =>
      assert.ok(
        Math.abs(probability - fixtures.probabilities[index][column]) < 1e-12,
        `case ${index}, class ${column}`,
      ),
    );
    assert.equal(
      result.prediction,
      fixtures.probabilities[index][1] > 0.5 ? "Hypertensive" : "Healthy",
    );
  }
  assert.throws(() => predictBloodPressure(model, leaves, {}), TypeError);
});

await test("BP schema retains all 16 feature names, population sd, units and single-reading support", async () => {
  const schema = json<FormSchema>("../../src/clinical-demos/lab2pressure-schema.json");
  const initialValues = {
    "urea-nitrogen": [{ value: 12 }, { value: 18 }],
    chloride: [{ value: 100 }, { value: 102 }],
    glucose: [{ value: 90 }, { value: 110 }],
    potassium: [{ value: 4 }, { value: 4.2 }],
    "blood-pressure": [
      { systolic: 120, diastolic: 70 },
      { systolic: 140, diastolic: 90 },
    ],
  };
  const form = createForm({
    registry: createBuiltinMlRegistry(),
    schema,
    initialValues,
    transport: { submit: async () => ({ reports: [] }) },
  });
  assert.equal((await form.validate()).valid, true);
  const values = createSubmissionSnapshot(form, { backend: BP_MODEL }).modelValues;
  assert.equal(Object.keys(values).length, 16);
  assert.deepEqual(values, {
    "Urea Nitrogen_max": 18,
    Chloride_min: 100,
    Glucose_max: 110,
    Potassium_min: 4,
    bp_s_mean: 130,
    bp_s_sd: 10,
    bp_s_q1: 125,
    bp_s_q3: 135,
    bp_s_min: 120,
    bp_s_max: 140,
    bp_d_mean: 80,
    bp_d_sd: 10,
    bp_d_q1: 75,
    bp_d_q3: 85,
    bp_d_min: 70,
    bp_d_max: 90,
  });
  form.setValues({ "blood-pressure": [{ systolic: 150, diastolic: 95 }] });
  assert.equal((await form.validate()).valid, true);
  assert.equal(createSubmissionSnapshot(form).modelValues.bp_s_sd, 0);
  form.setValues({ "blood-pressure": [{ systolic: 150, diastolic: null }] });
  assert.equal((await form.validate()).valid, false);
  form.setValues({ chloride: [{ value: -1 }] });
  assert.equal((await form.validate()).valid, false);
  form.dispose();
});

await test("DoseTailor switches required targets without submitting hidden dose/level", async () => {
  const schema = { ...DOSETAILOR_SCHEMA, reports: [] };
  const form = createForm({
    registry: createBuiltinMlRegistry(),
    schema,
    initialValues: toDoseTailorFormValues(DOSETAILOR_EXAMPLES[0].values),
    transport: { submit: async () => ({ reports: [] }) },
  });
  assert.equal((await form.validate()).valid, true);
  let values = createSubmissionSnapshot(form).modelValues;
  assert.equal(values.level, 8);
  assert.equal(values.dose, undefined);
  form.setValues({ "predict-with": "dose" });
  assert.equal((await form.validate()).valid, false);
  form.setValues({ dose: 5 });
  assert.equal((await form.validate()).valid, true);
  values = createSubmissionSnapshot(form).modelValues;
  assert.equal(values.dose, 5);
  assert.equal(values.level, undefined);
  form.dispose();
});

await test("DoseTailor selects all four real API routes and treats No/Home as valid categories", () => {
  const values = { ...DOSETAILOR_EXAMPLES[1].values };
  let request = createDoseTailorRequest(values);
  assert.equal(request.path, "/recommend_dose/labs");
  assert.equal(request.body.state, 0);
  assert.equal(request.body.pgp_inhibit, 0);
  assert.equal(request.body.age_group, 3);
  assert.equal(request.body.target_level, 10);
  assert.equal(request.body.dose, 0);
  assert.equal(request.body.predict_with, undefined);
  request = createDoseTailorRequest({ ...values, predict_with: "dose", dose: 5 });
  assert.equal(request.path, "/inference/labs");
  assert.equal(request.body.target_level, undefined);
  assert.equal(request.body.dose, 5);
  request = createDoseTailorRequest({ ...values, creatinine: null });
  assert.equal(request.path, "/recommend_dose/nolabs");
  assert.equal(request.body.ast, undefined);
  assert.equal(
    createDoseTailorRequest({ ...values, creatinine: null, predict_with: "dose" }).path,
    "/inference/nolabs",
  );
  for (const [age, group] of [
    [18, 0],
    [29, 0],
    [30, 1],
    [39, 1],
    [40, 2],
    [75, 5],
    [80, 6],
    [100, 6],
  ]) {
    assert.equal(createDoseTailorRequest({ ...values, age }).body.age_group, group);
  }
});

await test("DoseTailor rejects malformed remote results instead of drawing fabricated predictions", () => {
  assert.deepEqual(normalizeDoseTailorResponse({ predicted_level: 7.2 }, false), {
    mode: "dose",
    level: 7.2,
  });
  const response = { optimal_dose: 5, optimal_level: 8, dose_values: [1, 5], predictions: [2, 8] };
  assert.deepEqual(normalizeDoseTailorResponse(response, true).points, [
    { dose: 1, level: 2 },
    { dose: 5, level: 8 },
  ]);
  assert.throws(() => normalizeDoseTailorResponse({ ...response, predictions: [2] }, true));
  assert.throws(() => normalizeDoseTailorResponse({ predicted_level: "7.2" }, false));
  assert.throws(() => normalizeDoseTailorResponse({ predicted_level: Infinity }, false));
});

await test("DoseTailor surfaces API failures and forwards MLForm cancellation", async (context) => {
  const controller = new AbortController();
  context.mock.method(
    globalThis,
    "fetch",
    async (_url: RequestInfo | URL, options: RequestInit) => {
      assert.ok(options.signal instanceof AbortSignal);
      assert.equal(typeof options.body, "string");
      assert.equal(JSON.parse(options.body as string).target_level, 8);
      return { ok: false, status: 503 };
    },
  );
  await assert.rejects(
    createDoseTailorTransport().submit({
      inputs: [],
      fields: [],
      reports: [],
      displayValues: {},
      modelValues: DOSETAILOR_EXAMPLES[0].values,
      signal: controller.signal,
    }),
    /unavailable \(503\)/,
  );
});
