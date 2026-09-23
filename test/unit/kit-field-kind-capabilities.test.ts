import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { defineFieldKind } from "@/view";
import { createForm } from "@/runtime";
import { createRegistry } from "@/schema";

describe("declarative field kind capabilities", () => {
  it("forwards advanced definition validation and submission behavior", async () => {
    const validateRuntime = vi.fn();
    const kind = defineFieldKind({
      kind: "derived-value",
      schema: z.object({
        id: z.string().optional(),
        kind: z.literal("derived-value"),
        label: z.string(),
      }),
      definition: {
        validateRuntime,
        getMappedTargets: () => ["derived_output"],
        getSubmissionEntries: (value) => [{ target: "derived_output", value }],
      },
      render: { widget: "text" },
    });
    const registry = createRegistry().registerField(kind.definition);
    const submit = vi.fn().mockResolvedValue({});
    const form = createForm({
      schema: { fields: [{ kind: "derived-value", label: "Derived" }] },
      registry,
      transport: { submit },
    });

    expect(validateRuntime).toHaveBeenCalledOnce();
    form.setValues({ derived: "ready" });
    await form.submit();

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ modelValues: { derived_output: "ready" } }),
    );
  });

  it("requires custom submission entries to declare and honor their targets", async () => {
    const undeclaredKind = defineFieldKind({
      kind: "undeclared-entry",
      schema: z.object({
        id: z.string().optional(),
        kind: z.literal("undeclared-entry"),
        label: z.string(),
      }),
      definition: {
        getSubmissionEntries: (value) => [{ target: "hidden_target", value }],
      },
      render: { widget: "text" },
    });
    const undeclaredRegistry = createRegistry().registerField(undeclaredKind.definition);

    expect(() =>
      createForm({
        schema: { fields: [{ kind: "undeclared-entry", label: "Undeclared" }] },
        registry: undeclaredRegistry,
        transport: { submit: vi.fn().mockResolvedValue({}) },
      }),
    ).toThrow("without declaring their targets through getMappedTargets");

    const mismatchedKind = defineFieldKind({
      kind: "mismatched-entry",
      schema: z.object({
        id: z.string().optional(),
        kind: z.literal("mismatched-entry"),
        label: z.string(),
      }),
      definition: {
        getMappedTargets: () => ["declared_target"],
        getSubmissionEntries: (value) => [{ target: "hidden_target", value }],
      },
      render: { widget: "text" },
    });
    const mismatchedRegistry = createRegistry().registerField(mismatchedKind.definition);
    const form = createForm({
      schema: { fields: [{ kind: "mismatched-entry", label: "Mismatched" }] },
      registry: mismatchedRegistry,
      transport: { submit: vi.fn().mockResolvedValue({}) },
    });

    await expect(form.submit()).rejects.toThrow(
      'submission target "hidden_target" was not declared',
    );
  });

  it("merges sibling paths emitted by separate custom fields", async () => {
    const kind = defineFieldKind({
      kind: "patient-property",
      schema: z
        .object({
          id: z.string().optional(),
          kind: z.literal("patient-property"),
          label: z.string(),
          mappedTo: z.string(),
        })
        .passthrough(),
      definition: {
        getMappedTargets: (config) => [config.mappedTo],
        getSubmissionEntries: (value, _serialized, config) => [{ target: config.mappedTo, value }],
      },
      render: { widget: "text" },
    });
    const registry = createRegistry().registerField(kind.definition);
    const submit = vi.fn().mockResolvedValue({});
    const form = createForm({
      schema: {
        fields: [
          { kind: "patient-property", label: "Age", mappedTo: "patient.age" },
          { kind: "patient-property", label: "Name", mappedTo: "patient.name" },
        ],
      },
      registry,
      transport: { submit },
    });

    form.setValues({ age: 42, name: "Ada" });
    await form.submit();

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ modelValues: { patient: { age: 42, name: "Ada" } } }),
    );
  });
});
