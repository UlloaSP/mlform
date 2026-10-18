export const PLAYGROUND_WIZARD_LAYOUTS = {
  reports: {
    kind: "wizard",
    steps: [
      {
        id: "inputs-a",
        title: "Core controls",
        description: "General controls first.",
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
        id: "inputs-b",
        title: "Operational signals",
        description: "High-cardinality inputs on dedicated step.",
        children: [
          { kind: "field", field: "daily-signal" },
          { kind: "field", field: "channel-performance" },
          { kind: "field", field: "feature-flags" },
          { kind: "field", field: "version-scores" },
        ],
      },
      {
        id: "reports",
        title: "Reports pane inside wizard",
        description: "Final step with all reports grouped by backend and aggregate view.",
        children: [
          {
            kind: "section",
            title: "Decision",
            defaultOpen: true,
            children: [
              {
                kind: "group",
                columns: 3,
                children: [
                  { kind: "report", report: "baseline-recommendation" },
                  { kind: "report", report: "optimistic-recommendation" },
                  { kind: "report", report: "conservative-recommendation" },
                ],
              },
            ],
          },
          {
            kind: "section",
            title: "Latency",
            defaultOpen: false,
            children: [
              {
                kind: "group",
                columns: 3,
                children: [
                  { kind: "report", report: "baseline-latency" },
                  { kind: "report", report: "optimistic-latency" },
                  { kind: "report", report: "conservative-latency" },
                ],
              },
            ],
          },
          { kind: "report", report: "backend-compare" },
        ],
      },
    ],
  },
};
