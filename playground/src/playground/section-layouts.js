export const PLAYGROUND_SECTIONED_LAYOUT = {
  kind: "stacked",
  children: [
    {
      kind: "section",
      id: "release-controls",
      title: "Release controls",
      description: "Core metadata and rollout gates.",
      defaultOpen: true,
      children: [
        {
          kind: "group",
          columns: 2,
          children: [
            { kind: "field", field: "release-name" },
            { kind: "field", field: "deployment-channel" },
            { kind: "field", field: "training-epochs" },
            { kind: "field", field: "evaluation-date" },
            { kind: "field", field: "confidence-threshold" },
            { kind: "field", field: "human-approval" },
            { kind: "field", field: "risk-tier" },
            { kind: "field", field: "channel-prototype" },
            { kind: "field", field: "channel-canary" },
            { kind: "field", field: "channel-regional" },
            { kind: "field", field: "channel-production" },
          ],
        },
      ],
    },
    {
      kind: "section",
      id: "deployment-signals",
      title: "Deployment signals",
      description: "Operational series and rollout flags.",
      defaultOpen: false,
      children: [
        { kind: "field", field: "daily-signal" },
        {
          kind: "group",
          columns: 2,
          children: [
            { kind: "field", field: "channel-performance" },
            { kind: "field", field: "feature-flags" },
            { kind: "field", field: "version-scores" },
          ],
        },
      ],
    },
    {
      kind: "section",
      id: "backend-reports",
      title: "Backend reports",
      description: "Aggregate and per-backend report outputs.",
      defaultOpen: false,
      children: [
        { kind: "report", report: "backend-compare" },
        {
          kind: "group",
          columns: 3,
          children: [
            { kind: "report", report: "baseline-recommendation" },
            { kind: "report", report: "optimistic-recommendation" },
            { kind: "report", report: "conservative-recommendation" },
            { kind: "report", report: "baseline-latency" },
            { kind: "report", report: "optimistic-latency" },
            { kind: "report", report: "conservative-latency" },
          ],
        },
      ],
    },
  ],
};
