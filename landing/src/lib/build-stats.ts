import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { json, readStats, statSources, type Stats } from "./stats";

// Every dev render and build reads the same numbers, so they come from a short-lived cache.
// A source that fails keeps its last real value instead of dropping to a plain link.
const cacheFile = join(process.cwd(), "node_modules", ".cache", "landing-stats.json");
// A complete set is kept for an hour; a set with a missing source is retried after ten minutes.
const cacheAge = (stats: Stats) => (Object.values(stats).includes(null) ? 10 : 60) * 60 * 1000;
const readCache = async (): Promise<{ fetchedAt: number; stats: Stats } | null> => {
  try {
    return JSON.parse(await readFile(cacheFile, "utf8"));
  } catch {
    return null;
  }
};

const token = process.env.GITHUB_TOKEN;

export const getStats = async (): Promise<Stats> => {
  const cached = await readCache();
  if (cached && Date.now() - cached.fetchedAt < cacheAge(cached.stats)) return cached.stats;
  const [version, downloads, stars] = await Promise.all([
    json(statSources.version),
    json(statSources.downloads),
    // An optional token lifts GitHub's anonymous limit of 60 requests an hour.
    json(statSources.stars, token ? { authorization: `Bearer ${token}` } : {}),
  ]);
  const fresh = readStats({ version, downloads, stars });
  const stats: Stats = {
    version: fresh.version ?? cached?.stats.version ?? null,
    downloads: fresh.downloads ?? cached?.stats.downloads ?? null,
    stars: fresh.stars ?? cached?.stats.stars ?? null,
  };
  await mkdir(dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, JSON.stringify({ fetchedAt: Date.now(), stats }));
  return stats;
};
