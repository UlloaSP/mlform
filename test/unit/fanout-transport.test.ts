// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it } from "vitest";
import { createFanoutTransport } from "@/transport";
import type { SubmitRequest } from "@/transport";

const request = {
  fields: [],
  reports: [],
  inputs: [],
  displayValues: {},
  modelValues: {},
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

  it("merges successful fail-fast outcomes with an external signal", async () => {
    const controller = new AbortController();
    const transport = createFanoutTransport({
      targets: ["a", "b"],
      failurePolicy: "fail-fast",
      submit: async (target, targetRequest) => {
        expect(targetRequest.signal).toBeDefined();
        return `${target}-result`;
      },
      merge: (outcomes) => outcomes,
    });

    await expect(transport.submit({ ...request, signal: controller.signal })).resolves.toEqual([
      { target: "a", status: "fulfilled", value: "a-result" },
      { target: "b", status: "fulfilled", value: "b-result" },
    ]);
  });

  it("rejects a request whose signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort(new Error("already cancelled"));
    const transport = createFanoutTransport({
      targets: ["a"],
      submit: async () => "unused",
      merge: () => null,
    });

    await expect(transport.submit({ ...request, signal: controller.signal })).rejects.toMatchObject(
      { code: "ABORTED", message: "already cancelled" },
    );
  });
});
