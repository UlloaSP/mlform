export const CLASSIFIER_LABELS = ["Hold", "Pilot", "Ship"];

export const BACKENDS = [
  {
    id: "baseline",
    label: "Baseline",
    recommendationBias: 0,
    latencyBias: 0,
    scoreBias: 0,
  },
  {
    id: "optimistic",
    label: "Optimistic",
    recommendationBias: 16,
    latencyBias: -24,
    scoreBias: 10,
  },
  {
    id: "conservative",
    label: "Conservative",
    recommendationBias: -12,
    latencyBias: 28,
    scoreBias: -8,
  },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const randomBetween = (min, max) => {
  const low = Math.min(Number(min), Number(max));
  const high = Math.max(Number(min), Number(max));
  return low + Math.random() * (high - low);
};

const randomInt = (min, max) => Math.round(randomBetween(min, max));

const buildProbabilityRows = (labels, favoredIndex) => {
  const weights = labels.map((_, index) =>
    index === favoredIndex ? randomBetween(0.58, 0.86) : randomBetween(0.05, 0.22),
  );
  const total = weights.reduce((sum, value) => sum + value, 0) || 1;
  return weights.map((value) => Number((value / total).toFixed(4)));
};

const computeNumericSignal = (inputs) => {
  let signal = 45;

  for (const value of Object.values(inputs)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      signal += value * 0.8;
      continue;
    }

    if (typeof value === "boolean") {
      signal += value ? 4 : -3;
      continue;
    }

    if (typeof value === "string") {
      signal += Math.min(value.length, 18) * 0.7;
      continue;
    }

    if (Array.isArray(value)) {
      for (const point of value) {
        const numeric = Number(point?.value);
        if (!Number.isNaN(numeric)) {
          signal += numeric * 0.35;
        }
      }
    }
  }

  return signal;
};

const resolveRecommendationIndex = (score) => {
  if (score < 90) {
    return 0;
  }

  if (score < 125) {
    return 1;
  }

  return 2;
};

export const buildBackendResponse = (backend, inputs) => {
  const numericSignal = computeNumericSignal(inputs);
  const recommendationSignal = numericSignal + backend.recommendationBias + randomBetween(-8, 8);
  const recommendationIndex = resolveRecommendationIndex(recommendationSignal);
  const recommendation = CLASSIFIER_LABELS[recommendationIndex];
  const probabilities = buildProbabilityRows(CLASSIFIER_LABELS, recommendationIndex);
  const latencyValue = Number(
    clamp(
      randomBetween(
        numericSignal * 0.72 + backend.latencyBias,
        numericSignal * 0.94 + backend.latencyBias,
      ),
      40,
      950,
    ).toFixed(1),
  );
  const latencySpread = Number(randomBetween(10, 36).toFixed(1));
  const launchScore = Math.round(
    clamp(
      randomBetween(
        numericSignal * 0.5 + backend.scoreBias,
        numericSignal * 0.82 + backend.scoreBias,
      ),
      0,
      100,
    ),
  );

  return {
    reports: {
      releaseRecommendation: {
        prediction: recommendation,
        probabilities,
        execution_time: randomInt(18, 42),
      },
      latencyForecast: {
        value: latencyValue,
        interval: [
          Number(Math.max(latencyValue - latencySpread, 0).toFixed(1)),
          Number((latencyValue + latencySpread).toFixed(1)),
        ],
        execution_time: randomInt(22, 58),
      },
      launchScore: {
        value: launchScore,
        execution_time: randomInt(14, 34),
      },
    },
    meta: {
      backend: backend.id,
      label: backend.label,
      generatedAt: new Date().toISOString(),
    },
  };
};
