import { API_ROUTES } from "./server/api-routes.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    const route = API_ROUTES.find(({ prefix, paths }) =>
      paths.some((path) => url.pathname === prefix + path),
    );
    if (!route) return new Response("Unknown prediction endpoint", { status: 404 });
    if (request.method !== "POST") {
      return new Response("Use POST for predictions", { status: 405, headers: { Allow: "POST" } });
    }

    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]);
    try {
      const response = await fetch(
        route.target + url.pathname.slice(route.prefix.length) + url.search,
        {
          method: "POST",
          // Browser credentials and origin headers do not belong to the upstream API.
          headers: { "Content-Type": request.headers.get("Content-Type") ?? "application/json" },
          body: request.body,
          signal,
        },
      );
      return new Response(response.body, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("Content-Type") ?? "application/json",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return Response.json(
        { error: "The prediction server is unavailable. Please try again." },
        { status: signal.aborted ? 504 : 502, headers: { "Cache-Control": "no-store" } },
      );
    }
  },
};
