import assert from "node:assert/strict";
import { test } from "node:test";
import { createForm } from "mlform/runtime";
import { createBuiltinMlRegistry, builtinFieldKinds } from "mlform/builtins";
import {
  FIELD_COMBINATIONS_SCHEMA,
  FIELD_CASE_VALUES,
} from "../../src/playground/field-combinations-schema.ts";

await test("Field combos covers every built-in kind with real validation and inactive states", async () => {
  const form = createForm({
    schema: FIELD_COMBINATIONS_SCHEMA,
    registry: createBuiltinMlRegistry(),
    transport: {
      async submit() {
        return { reports: [] };
      },
    },
  });
  try {
    form.setValues(FIELD_CASE_VALUES);
    await form.validate();
    for (const kind of Object.values(builtinFieldKinds)) {
      assert.equal(form.getField(`${kind}-success`)!.state.valid, true, `${kind} success`);
      assert.deepEqual(form.getField(`${kind}-required-empty`)!.state.errors, [
        "This field is required.",
      ]);
      assert.equal(form.getField(`${kind}-optional-empty`)!.state.valid, true);
      assert.equal(form.getField(`${kind}-disabled`)!.state.disabled, true);
      assert.equal(form.getField(`${kind}-read-only`)!.state.readOnly, true);
      assert.equal(form.getField(`${kind}-conditional`)!.state.visible, false);
    }
    const invalid = [
      "text-pattern-invalid-default",
      "text-below-minimum-length",
      "text-too-long",
      "text-multiple-errors",
      "long-text-short",
      "long-text-long",
      "number-step-mismatch",
      "number-below-minimum",
      "number-above-maximum",
      "number-offset-invalid",
      ...Object.keys(FIELD_CASE_VALUES),
      "category-invalid-default",
      "date-step-mismatch",
      "date-before-minimum",
      "date-after-maximum",
      "rating-below",
      "rating-above",
      "rating-step",
      "single-choice-invalid",
      "multi-choice-invalid",
      "mapped-category-invalid",
      "onehot-category-invalid",
      "series-too-few",
      "series-too-many",
      "series-cell-required",
      "series-cell-number",
      "series-cell-min",
      "series-cell-max",
      "series-cell-step",
      "series-cell-text-short",
      "series-cell-text-long",
      "series-cell-text-pattern",
      "series-cell-category-invalid",
      "series-cell-date-min",
      "series-cell-date-max",
      "series-cell-date-step",
      "series-cell-boolean-required",
      "series-aggregate-insufficient",
      "series-aggregate-missing",
      ...Object.values(builtinFieldKinds).map((kind) => `${kind}-required-empty`),
    ];
    assert.deepEqual(
      form.fields
        .filter((field) => !field.state.valid)
        .map((field) => field.id)
        .sort(),
      invalid.sort(),
    );
    form.setValues({ "show-conditional-cases": true });
    for (const kind of Object.values(builtinFieldKinds))
      assert.equal(form.getField(`${kind}-conditional`)!.state.visible, true);
  } finally {
    form.dispose();
  }
});
