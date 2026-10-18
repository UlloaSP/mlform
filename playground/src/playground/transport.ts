import type { SubmitRequest } from "mlform/transport";
import { BACKENDS, buildBackendResponse } from "./shared/model.ts";

export const createAggregateTransport = () => ({
  submit: async (request: SubmitRequest) => {
    const inputs = request.modelValues;

    await new Promise((resolve) => setTimeout(resolve, 220));

    const backends = Object.fromEntries(
      BACKENDS.map((backend) => [
        backend.id,
        { ...buildBackendResponse(backend, inputs), id: backend.id, label: backend.label },
      ]),
    );
    const reports = [];

    for (const backend of BACKENDS) {
      const backendReports = backends[backend.id]?.reports ?? {};
      for (const [reportKey, payload] of Object.entries(backendReports)) {
        reports.push({
          backend: backend.id,
          mappedTo: reportKey,
          status: "ready" as const,
          payload,
        });
      }
    }

    return {
      reports,
      meta: {
        aggregatedAt: new Date().toISOString(),
        backends: BACKENDS.map(({ id, label }) => ({ id, label })),
      },
      raw: {
        backends,
      },
    };
  },
});
