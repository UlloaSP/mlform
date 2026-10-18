import assert from "node:assert/strict";
import { test } from "node:test";
import { createForm, createSubmissionSnapshot } from "mlform/runtime";
import { createBuiltinMlRegistry } from "mlform/builtins";
import { createFormulationSchema } from "../../src/formulation-demo/schema.js";
import { FORMULATION_EXAMPLES } from "../../src/formulation-demo/examples.js";
import {
  createFormulationRequest,
  createFormulationTransport,
} from "../../src/formulation-demo/transport.js";

const valuesFor = (example) => {
  const form = createForm({
    registry: createBuiltinMlRegistry(),
    schema: { ...createFormulationSchema(), reports: [] },
    initialValues: example.values,
    transport: { submit: async () => ({ reports: [] }) },
  });
  const values = createSubmissionSnapshot(form).modelValues;
  form.dispose();
  return values;
};

await test("M3DISEEN examples validate and map to the real material keys in percentage units", async () => {
  for (const example of FORMULATION_EXAMPLES) {
    const form = createForm({
      registry: createBuiltinMlRegistry(),
      schema: { ...createFormulationSchema(), reports: [] },
      initialValues: example.values,
      transport: { submit: async () => ({ reports: [] }) },
    });
    assert.equal((await form.validate()).valid, true, example.id);
    form.dispose();
    assert.equal(
      Object.values(createFormulationRequest(valuesFor(example)).data.formulation).reduce(
        (a, b) => a + b,
        0,
      ),
      100,
    );
  }
  const { data } = createFormulationRequest(valuesFor(FORMULATION_EXAMPLES[1]));
  assert.deepEqual(data.formulation, {
    "Hydroxypropyl_methyl_cellulose_acetate_succinate_(Aqoat_AS-HG)@Shin-Etsu": 40,
    "Polyethylene_glycol_(PEG_400)@Yakuri_pure_chemicals": 10,
    "Pregabalin@GL_PharrmTech": 50,
  });
  assert.equal(data.shape, "Cylinder");
  assert.equal(data.object, "Tablet");
  assert.equal(data.printer_brand, "\u00a0good_bot_4025-mp");
  assert.equal(data.volume_dissolution_media, 500);
  assert.throws(
    () => createFormulationRequest({ ...valuesFor(FORMULATION_EXAMPLES[1]), pregabalin: 40 }),
    /100%/,
  );
});

await test("M3DISEEN aggregates five public models and preserves partial failures without mock values", async (context) => {
  const calls = [];
  const predictions = {
    filament_mechanical_characteristics: "Good",
    extrusion_temp: 110,
    printability: "yes",
    dissolution: [62, 210, 290],
  };
  context.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    const model = url.split("/").at(-1);
    return model === "printing_temp"
      ? { ok: false, status: 500 }
      : { ok: true, json: async () => ({ prediction: predictions[model] }) };
  });
  const result = await createFormulationTransport().submit({
    modelValues: valuesFor(FORMULATION_EXAMPLES[1]),
  });
  assert.equal(calls.length, 5);
  assert.ok(calls.every((call) => call.url.startsWith("/api/m3diseen/a2022/")));
  const prediction = result.reports[0].payload;
  assert.equal(prediction.summary.printability, "Yes");
  assert.equal(prediction.summary.extrusionTemperature, 110);
  assert.equal(prediction.summary.printingTemperature, undefined);
  assert.match(prediction.errors[0], /Printing temperature.*HTTP 500/);
  assert.deepEqual(prediction.curve, [
    { timeMinutes: 0, dissolvedPercent: 0 },
    { timeMinutes: 62, dissolvedPercent: 20 },
    { timeMinutes: 210, dissolvedPercent: 50 },
    { timeMinutes: 290, dissolvedPercent: 80 },
  ]);
  assert.equal(result.meta.partial, true);
});

await test("M3DISEEN rejects HTTP-200 application errors and all-model outages", async (context) => {
  context.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    json: async () => ({ error: "upstream error" }),
  }));
  await assert.rejects(
    createFormulationTransport().submit({ modelValues: valuesFor(FORMULATION_EXAMPLES[1]) }),
    /could not return a prediction/,
  );
});
