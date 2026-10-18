// Package numbers shared by the build (build-stats.ts) and the browser refresh (scripts/stats.ts).
// Each source fails independently to null so a flaky API never breaks a build.
export const statSources = {
  version: "https://registry.npmjs.org/mlform/latest",
  downloads: "https://api.npmjs.org/downloads/point/last-month/mlform",
  stars: "https://api.github.com/repos/UlloaSP/mlform",
} as const;

export interface Stats {
  version: string | null;
  downloads: number | null;
  stars: number | null;
}

export const json = async (
  url: string,
  headers: Record<string, string> = {},
): Promise<Record<string, unknown> | null> => {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(7000) });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};
const number = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export const readStats = (data: {
  version: Record<string, unknown> | null;
  downloads: Record<string, unknown> | null;
  stars: Record<string, unknown> | null;
}): Stats => ({
  version: typeof data.version?.version === "string" ? data.version.version : null,
  downloads: number(data.downloads?.downloads),
  stars: number(data.stars?.stargazers_count),
});

export const formatCount = (value: number) => new Intl.NumberFormat("en").format(value);
