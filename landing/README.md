# MLForm landing

The product site at <https://mlform.eshkra.dev>, built with Astro. It shares the eshkra palette, Mona Sans and JetBrains Mono fonts, and the repository's original MLForm mark. The page and its real playground captures follow the visitor's light or dark system preference.

## Local development

From this directory, with Node.js 22.18 or newer and Vite+ installed:

```sh
vp install --frozen-lockfile
vp run dev
```

Open <http://127.0.0.1:4322>. `vp run build` checks Astro/TypeScript and produces the static site; `vp run preview` serves that build. Use `vp run check:format` to check formatting or `vp run format` to apply it.

## Refresh the screenshots

Build MLForm and start the playground from the repository root:

```sh
vp run playground
```

Then, in `playground/`:

```sh
vp exec playwright install chromium
vp exec tsx scripts/capture-landing.ts
```

The script mounts each example in the playground editor with the eshkra design system, waits for rendering and fonts, and captures the real components in both modes: the hero form, every built-in field kind, a series table, the four layouts, groups and sections, a custom plugin and a two-backend form. It also writes `src/data/annotations.json`, the measured positions of the labels drawn over the hero and the groups-and-sections capture. Set `PLAYGROUND_URL` if the server uses a different address from `http://127.0.0.1:10001`. Prediction and classification results are illustrative local responses, not trained models.

Every screenshot opens at full size in a dialog. Without JavaScript all screenshots remain inline.

Monthly npm downloads, the latest npm version and GitHub stars are fetched at build time and refreshed in the browser. A source that fails keeps its build-time value, or a plain link to npm or GitHub when none was available; no number is invented.

## Deployment

CI validates and builds the landing on every supported push and pull request. After a successful npm publication on `main`, it deploys the verified landing, docs and playground artifacts to Cloudflare Workers. `wrangler.jsonc` binds this site's custom domain to `mlform.eshkra.dev`.

For the first deployment or a website-only update, run **CI & Publish** manually on `main` with **deploy_sites** enabled. This runs the quality gates and deploys all three sites without publishing a package version.

Deployments reuse the repository's `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets. The token must permit Workers deployment and custom-domain creation in the `eshkra.dev` zone. The `landing` GitHub environment can apply the same deployment restrictions as `docs` and `playground`.
