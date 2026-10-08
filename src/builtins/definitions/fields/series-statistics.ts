// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export const arithmeticMean = (values: readonly number[]): number => {
  const sum = values.reduce((total, value) => total + value, 0);
  if (Number.isFinite(sum)) return sum / values.length;
  // Scale only when the intermediate sum overflows; ordinary means keep their precision.
  const scale = values.reduce((largest, value) => Math.max(largest, Math.abs(value)), 0);
  return (values.reduce((total, value) => total + value / scale, 0) / values.length) * scale;
};

export const linearQuantile = (sorted: readonly number[], q: number): number => {
  const position = q * (sorted.length - 1);
  const index = Math.floor(position);
  const fraction = position - index;
  const lower = sorted[index]!;
  const upper = sorted[Math.min(index + 1, sorted.length - 1)]!;
  if (lower === upper) return lower;
  return (1 - fraction) * lower + fraction * upper;
};

export const smallestMode = (sorted: readonly number[]): number => {
  let mode = sorted[0]!;
  let bestCount = 0;
  let count = 0;
  let previous: number | undefined;
  for (const value of sorted) {
    count = value === previous ? count + 1 : 1;
    if (count > bestCount) {
      mode = value;
      bestCount = count;
    }
    previous = value;
  }
  return mode;
};

const centeredValues = (values: readonly number[], center = arithmeticMean(values)) => {
  const deviations = values.map((value) => value - center);
  if (deviations.every(Number.isFinite)) {
    const scale = deviations.reduce((largest, value) => Math.max(largest, Math.abs(value)), 0);
    return { scale, normalized: deviations.map((value) => (scale === 0 ? 0 : value / scale)) };
  }
  const scale = values.reduce((largest, value) => Math.max(largest, Math.abs(value)), 0);
  return { scale, normalized: values.map((value) => value / scale - center / scale) };
};

const scaledStandardDeviation = (values: readonly number[], ddof: number) => {
  const { scale, normalized } = centeredValues(values);
  const deviation =
    values.length <= ddof
      ? Number.NaN
      : Math.sqrt(
          normalized.reduce((sum, value) => sum + value * value, 0) / (values.length - ddof),
        );
  return { scale, deviation };
};

export const standardDeviation = (values: readonly number[], ddof: number): number => {
  const { scale, deviation } = scaledStandardDeviation(values, ddof);
  return deviation * scale;
};

export const standardError = (values: readonly number[], ddof: number): number => {
  const { scale, deviation } = scaledStandardDeviation(values, ddof);
  return (deviation / Math.sqrt(values.length)) * scale;
};

export const coefficientOfVariation = (values: readonly number[], ddof: number): number => {
  const { scale, deviation } = scaledStandardDeviation(values, ddof);
  return deviation / (arithmeticMean(values) / scale);
};

export const medianAbsoluteDeviation = (sorted: readonly number[]): number => {
  const { scale, normalized } = centeredValues(sorted, linearQuantile(sorted, 0.5));
  return (
    linearQuantile(
      normalized.map(Math.abs).toSorted((a, b) => a - b),
      0.5,
    ) * scale
  );
};

export const meanAbsoluteDeviation = (values: readonly number[]): number => {
  const { scale, normalized } = centeredValues(values);
  return arithmeticMean(normalized.map(Math.abs)) * scale;
};

export const variance = (values: readonly number[], ddof: number): number => {
  if (values.length <= ddof) return Number.NaN;
  const mean = arithmeticMean(values);
  const squaredSum = values.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  return Number.isFinite(squaredSum)
    ? squaredSum / (values.length - ddof)
    : standardDeviation(values, ddof) ** 2;
};

export const standardizedMoment = (
  values: readonly number[],
  order: 3 | 4,
  bias: boolean,
): number => {
  const n = values.length;
  if (!bias && n <= order - 1) return Number.NaN;
  const { normalized } = centeredValues(values);
  const m2 = arithmeticMean(normalized.map((value) => value ** 2));
  if (m2 === 0) return Number.NaN;
  const moment = arithmeticMean(normalized.map((value) => value ** order));
  if (order === 3) {
    const skew = moment / m2 ** 1.5;
    return bias ? skew : (Math.sqrt(n * (n - 1)) / (n - 2)) * skew;
  }
  const kurtosis = moment / (m2 * m2);
  return bias ? kurtosis : ((n - 1) * ((n + 1) * kurtosis - 3 * (n - 1))) / ((n - 2) * (n - 3)) + 3;
};

export const geometricMean = (values: readonly number[]): number => {
  if (values.some((value) => value < 0)) return Number.NaN;
  if (values.includes(0)) return 0;
  if (values.every((value) => value === values[0])) return values[0]!;
  return Math.exp(arithmeticMean(values.map(Math.log)));
};

export const harmonicMean = (values: readonly number[]): number => {
  if (values.some((value) => value < 0)) return Number.NaN;
  const min = values.reduce((smallest, value) => Math.min(smallest, value), Infinity);
  return min === 0 ? 0 : min / arithmeticMean(values.map((value) => min / value));
};

export const rootMeanSquare = (values: readonly number[]): number => {
  const scale = values.reduce((largest, value) => Math.max(largest, Math.abs(value)), 0);
  return scale === 0
    ? 0
    : Math.sqrt(arithmeticMean(values.map((value) => (value / scale) ** 2))) * scale;
};

export const numericProduct = (values: readonly number[]): number => {
  if (values.includes(0)) return 0;
  const product = values.reduce((total, value) => total * value, 1);
  if (Number.isFinite(product) && product !== 0) return product;
  const sign = values.reduce((total, value) => (value < 0 ? -total : total), 1);
  return sign * Math.exp(values.reduce((sum, value) => sum + Math.log(Math.abs(value)), 0));
};
