// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it } from "vitest";
import { createFanoutTransport } from "@/transport";
import type { SubmitRequest } from "@/transport";

const request = {
  fields: [],
  reports: [],
  values: {},
  fieldValues: {},
  serializedValues: {},
  serializedFieldValues: {},
} satisfies SubmitRequest;

describe("createFanoutTransport", () => {
  it("submits every target in parallel and merges ordered outcomes", async () => {
    const transport = createFanoutTransport({
      targets: ["a", "b"],
      submit: async (target) => `${target}-result`,
      merge: (outcomes) => outcomes,
    });

    await expect(transport.submit(request)).resolves.toEqual([
      { target: "a", status: "fulfilled", value: "a-result" },
      { target: "b", status: "fulfilled", value: "b-result" },
    ]);
  });

  it("collects target failures by default", async () => {
    const error = new Error("offline");
    const transport = createFanoutTransport({
      targets: ["a", "b"],
      submit: async (target) => {
        if (target === "b") throw error;
        return target;
      },
      merge: (outcomes) => outcomes,
    });

    await expect(transport.submit(request)).resolves.toEqual([
      { target: "a", status: "fulfilled", value: "a" },
      { target: "b", status: "rejected", reason: error },
    ]);
  });

  it("supports fail-fast rejection", async () => {
    const transport = createFanoutTransport({
      targets: ["a"],
      failurePolicy: "fail-fast",
      submit: async () => {
        throw new Error("offline");
      },
      merge: () => null,
    });

    await expect(transport.submit(request)).rejects.toThrow("offline");
  });
});
