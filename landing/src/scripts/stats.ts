import { formatCount, readStats, statSources, type Stats } from "../lib/stats";

// Refreshes the build-time numbers at most once an hour per browser, so repeat visits stay inside
// the public API limits. A failed source leaves its build-time value or npm link.
const storageKey = "mlform-landing-stats";
const maxAge = 60 * 60 * 1000;
const fetchJson = (url: string) =>
  fetch(url, { signal: AbortSignal.timeout(7000) })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);
const show = (key: keyof Stats, value: Stats[keyof Stats]) => {
  if (value === null) return;
  const text = typeof value === "number" ? formatCount(value) : `v${value}`;
  for (const item of document.querySelectorAll<HTMLElement>(`[data-stat="${key}"]`)) {
    item.querySelector("strong")!.textContent = text;
    item.querySelector("[data-label]")!.textContent = item.dataset.label!;
  }
};
const keys = Object.keys(statSources) as (keyof Stats)[];
const read = (): { fetchedAt: number; stats: Stats } | null => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? "null");
  } catch {
    return null;
  }
};

const cached = read();
if (
  cached &&
  Date.now() - cached.fetchedAt < maxAge &&
  !Object.values(cached.stats).includes(null)
) {
  for (const key of keys) show(key, cached.stats[key]);
} else {
  const results = await Promise.all(keys.map((key) => fetchJson(statSources[key])));
  const data = Object.fromEntries(keys.map((key, index) => [key, results[index]]));
  const stats = readStats(data as Parameters<typeof readStats>[0]);
  for (const key of keys) show(key, stats[key]);
  try {
    localStorage.setItem(storageKey, JSON.stringify({ fetchedAt: Date.now(), stats }));
  } catch {
    // Storage can be unavailable; the numbers on the page are still current.
  }
}
