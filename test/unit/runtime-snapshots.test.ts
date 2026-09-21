import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import {
  createForm,
  removeFormSnapshot,
  restoreFormSnapshot,
  saveFormSnapshot,
  type FormPersistenceAdapter,
} from "@/runtime";
import { createRegistry } from "@/schema";
import { createBuiltinTestKit } from "../helpers/builtin-test-kit";

const createTextForm = (initialSnapshot?: unknown) =>
  createForm({
    schema: {
      fields: [
        { kind: "boolean", id: "advanced", label: "Advanced" },
        {
          kind: "text",
          id: "details",
          label: "Details",
          hiddenWhen: { kind: "field-value", field: "advanced", notEquals: true },
        },
      ],
    },
    registry: createBuiltinTestKit().registry,
    transport: { submit: vi.fn().mockResolvedValue({}) },
    initialSnapshot,
  });

describe("runtime snapshots", () => {
  it("restores values and interaction state in one observable transaction", () => {
    const source = createTextForm();
    source.setValues({ advanced: true, details: "restored" });
    const snapshot = source.createSnapshot();
    const target = createTextForm();
    const listener = vi.fn();
    target.subscribe(listener);

    target.restoreSnapshot(snapshot);

    expect(target.getValues()).toEqual({ advanced: true, details: "restored" });
    expect(target.getField("details")?.state).toMatchObject({
      touched: true,
      dirty: true,
      visible: true,
    });
    expect(target.state).toMatchObject({
      lifecycle: "active",
      operation: "idle",
      submissionStatus: "idle",
      submitCount: 0,
      lastResult: null,
    });
    expect(listener).toHaveBeenCalledOnce();
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it("rejects incompatible snapshots without changing form state", () => {
    const form = createTextForm();
    const before = form.state;
    const listener = vi.fn();
    form.subscribe(listener);
    const snapshot = JSON.parse(JSON.stringify(form.createSnapshot()));
    snapshot.schema.fields[0]!.kind = "number";

    expect(() => form.restoreSnapshot(snapshot)).toThrow("do not match the current schema");
    expect(form.state).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });

  it("uses field definitions to persist custom non-JSON values", () => {
    const registry = createRegistry().registerField({
      kind: "date-value",
      schema: z.object({ kind: z.literal("date-value"), id: z.string(), label: z.string() }),
      getDefaultValue: () => new Date("2025-01-01T00:00:00.000Z"),
      normalizeValue: (value) => (value instanceof Date ? value : new Date(String(value))),
      serializeSnapshotValue: (value) => (value as Date).toISOString(),
      restoreSnapshotValue: (value) => {
        if (typeof value !== "string") throw new TypeError("Expected a stored date string.");
        return new Date(value);
      },
    });
    const createDateForm = (initialSnapshot?: unknown) =>
      createForm({
        schema: { fields: [{ kind: "date-value", id: "date", label: "Date" }] },
        registry,
        transport: { submit: vi.fn() },
        initialSnapshot,
      });
    const source = createDateForm();
    source.setValues({ date: new Date("2026-06-15T00:00:00.000Z") });

    const restored = createDateForm(JSON.parse(JSON.stringify(source.createSnapshot())));

    expect(restored.getValues().date).toEqual(new Date("2026-06-15T00:00:00.000Z"));
  });

  it("rejects custom values that have no JSON snapshot representation", () => {
    const registry = createRegistry().registerField({
      kind: "map-value",
      schema: z.object({ kind: z.literal("map-value"), id: z.string(), label: z.string() }),
      getDefaultValue: () => new Map([["key", "value"]]),
    });
    const form = createForm({
      schema: { fields: [{ kind: "map-value", id: "data", label: "Data" }] },
      registry,
      transport: { submit: vi.fn() },
    });

    expect(() => form.createSnapshot()).toThrow("must be a plain object or array");
  });

  it("loads and saves through an asynchronous persistence adapter", async () => {
    const storage = new Map<string, unknown>();
    const adapter: FormPersistenceAdapter = {
      load: async (key) => storage.get(key) ?? null,
      save: async (key, snapshot) => void storage.set(key, snapshot),
      remove: async (key) => void storage.delete(key),
    };
    const source = createTextForm();
    source.setValues({ advanced: true, details: "persisted" });
    await saveFormSnapshot(source, adapter, "draft");
    const target = createTextForm();

    await expect(restoreFormSnapshot(target, adapter, "draft")).resolves.toBe(true);
    expect(target.getValues()).toEqual({ advanced: true, details: "persisted" });
    await removeFormSnapshot(adapter, "draft");
    await expect(restoreFormSnapshot(target, adapter, "draft")).resolves.toBe(false);
    await expect(restoreFormSnapshot(target, adapter, "missing")).resolves.toBe(false);
  });

  it("invalidates a pending submission before restoring", async () => {
    const transport = Promise.withResolvers<unknown>();
    const form = createTextForm();
    form.setValues({ advanced: true, details: "snapshot" });
    const snapshot = form.createSnapshot();
    const submitting = createForm({
      schema: {
        fields: [
          { kind: "boolean", id: "advanced", label: "Advanced" },
          {
            kind: "text",
            id: "details",
            label: "Details",
            hiddenWhen: { kind: "field-value", field: "advanced", notEquals: true },
          },
        ],
      },
      registry: createBuiltinTestKit().registry,
      transport: { submit: () => transport.promise },
    });
    submitting.setValues({ advanced: true, details: "obsolete" });
    const pending = submitting.submit();
    await vi.waitFor(() => expect(submitting.state.operation).toBe("submitting"));

    submitting.restoreSnapshot(snapshot);

    await expect(pending).rejects.toMatchObject({ name: "SubmissionAbortedError" });
    expect(submitting.getValues()).toEqual({ advanced: true, details: "snapshot" });
    expect(submitting.state).toMatchObject({ operation: "idle", submissionStatus: "idle" });
    transport.resolve({});
  });
});
