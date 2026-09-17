import { html } from "lit";
import { describe, expect, it, vi } from "vitest";
import {
  PrimitiveAsyncReportElement,
  type PrimitiveReportRequest,
  type PrimitiveReportTransport,
} from "@/primitives";

const request = (signal: AbortSignal): PrimitiveReportRequest => ({
  reportId: "probe",
  inputs: [],
  displayValues: {},
  modelValues: {},
  reports: [],
  reportContexts: {},
  meta: {},
  raw: undefined,
  signal,
});

describe("primitive async report requests", () => {
  it("composes the request signal with renderer cancellation", async () => {
    const tagName = "test-abortable-async-report";
    if (!customElements.get(tagName)) {
      customElements.define(
        tagName,
        class extends PrimitiveAsyncReportElement {
          render() {
            return html``;
          }
        },
      );
    }

    let receivedSignal: AbortSignal | undefined;
    const transport: PrimitiveReportTransport = {
      submit: vi.fn((transportRequest) => {
        receivedSignal = transportRequest.signal;
        return new Promise((_resolve, reject) => {
          receivedSignal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        });
      }),
    };
    const externalController = new AbortController();
    const element = document.createElement(tagName) as PrimitiveAsyncReportElement;
    element.transport = transport;
    element.request = request(externalController.signal);
    document.body.append(element);

    await element.updateComplete;
    expect(receivedSignal).toBeDefined();

    externalController.abort("host-cancelled");
    await Promise.resolve();

    expect(receivedSignal?.aborted).toBe(true);
    element.remove();
  });
});
