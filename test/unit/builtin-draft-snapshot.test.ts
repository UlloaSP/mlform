import { expect, it } from "vite-plus/test";
import { createForm } from "mlform/runtime";
import { createBuiltinMlRegistry } from "mlform/builtins";

it("round-trips dates, series and invalid numeric drafts through JSON snapshots", () => {
  const form = createForm({
    registry: createBuiltinMlRegistry(),
    schema: {
      fields: [
        { id: "day", kind: "date", label: "Day" },
        { id: "number", kind: "number", label: "Number" },
        {
          id: "series",
          kind: "series",
          label: "Series",
          columns: [
            { id: "day", kind: "date", label: "Day" },
            { id: "value", kind: "number", label: "Value" },
          ],
        },
      ],
    },
    transport: { submit: async () => ({ reports: [] }) },
  });
  form.setValues({ day: "2026-10-18", number: "1e-", series: [{ day: "2026-10-17", value: "-" }] });
  const before = form.getValues();
  const snapshot = JSON.parse(JSON.stringify(form.createSnapshot()));
  form.reset();
  form.restoreSnapshot(snapshot);
  expect(form.getValues()).toEqual(before);
  expect(form.getField("number")?.state.valid).toBe(false);
  expect(form.getField("series")?.state.valid).toBe(false);
  form.dispose();
});
