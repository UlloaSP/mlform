# MLForm playground

Vite playground for the public `mlform` API. This private workspace package uses the library built from the repository root through `workspace:*`.

Part of [eshkra](https://eshkra.dev). Branding follows the [shared MLform identity](../brand/README.md); form themes remain selectable independently.

## Demos

- `M3DISEEN`: custom formulation interface connected to the five public A2022 models, with real source examples and explicit partial errors when an upstream model is unavailable.
- `Lab2pressure/lite` (`/#lab2pressure-lite`): M3DISEEN-style interface for the real `Best BP Minimal` model. Four laboratory series and paired blood-pressure readings produce its exact 16 named inputs. Inference runs locally in the browser.
- `DoseTailor` (`/#dosetailor`): [Tacrolimus DoseTailor](https://dosetailor.com/tacrolimusv1) inputs and predictions, starting at Load Example with its original examples, field options, level prediction, optimal-dose recommendation and dose-level curve. Uses MLForm field primitives and the real public API.
- `Field combos`: built-in field combinations.
- `Series`: split view with editable series of 1, 2, 3 and 4 columns, schema and 35 calculated outputs. Expand the clinical example to see all 114 inputs for `Mejor Toda Bioquimica PA`.
- `Stacked`: stacked layout with collapsible sections.
- `Split`: split layout with internal scrolling.
- `Wizard`: wizard layout with final reports.
- `Tabs`: tabbed layout.

The Series examples keep aggregate summaries hidden in the form and expose help through field descriptions. Standard deviations use `ddof: 1`; quartiles use linear interpolation. The clinical classifier response is simulated.

## Commands

```bash
vp install
vp run playground
```

Run these commands from the repository root. `vp run playground` builds MLForm and serves the playground at `http://127.0.0.1:10001`. Restart it after library changes to rebuild MLForm; playground edits reload automatically.

To verify all demos, including Chromium desktop and mobile browser tests:

```bash
vp exec playwright install chromium
vp build
vp run check:playground
```

Browser tests start their own server on port `10002` and mock remote predictions. For individual checks, use `vp run playground#test:unit`, `vp run playground#test:mlform-api`, `vp run playground#test:e2e`, or `vp run playground#build`. To serve the production build with its API proxies, use `vp run playground#preview`.

Custom reports use `defineMLFormPlugin` from `mlform/view` and the public `plugins` option of `mountForm`/`createFormView`. Import `mountForm` from `mlform/kit` and `createFormView` from `mlform/view`.

M3DISEEN uses `createPrimitiveAdapter` from `mlform/kit` to keep fields and its report in stable interface slots. Its `custom` layout node declares the fields managed by the materials panel.

M3DISEEN calls `/api/m3diseen/a2022/*`, proxied to `https://api.m3diseen.com/a2022/*` in development and preview. The combined custom report aggregates filament characteristics, extrusion temperature, printability, printing temperature and dissolution. It displays available outputs and names each failed model; it never fills missing results with simulated predictions. All-model failures are shown as submission errors. The dissolution model returns times to 20%, 50% and 80% release, in that order, with exact values available below the chart. Calls have a 30-second timeout and are cancelled on input edits or unmount. Editing inputs also hides previous results until resubmission.

Its three examples reproduce the public `/experiments` records 245, 422 and 838 and their `/concentrations`, with percentages summing to 100. The local material catalog retains a small subset with exact upstream material/supplier identifiers. Supplier labels and equipment values match the public records. On 2026-10-15, four models returned predictions for example 422; `/a2022/printing_temp` returned HTTP 500 and is displayed as unavailable.

## Clinical demos

Both clinical demos use `mountForm` with native MLForm `section` and `group` layout nodes and built-in field primitives. Lab2pressure uses series fields; DoseTailor uses number and category fields and registers its combined prediction table and curve as a custom MLForm report plugin. The sections are collapsible, with no application-rendered section headings. Editing inputs hides the previous prediction until resubmission.

The BP schema is copied unchanged from `../../models/new-ones/mlbundles_0.1.0a2/best_BP_Minimal.json`. It accepts one observation per series, uses population blood-pressure standard deviations (`ddof: 0`) and linear quartiles. No extra scaling or imputation is applied. `public/models/` contains the numeric symmetric-tree model exported from the matching bundle; it is fetched only when predicting. Native CatBoost reference fixtures cover 72 cases, including float32 split boundaries, with probability tolerance `1e-12`.

To regenerate the model, schema and reference fixtures, you also need the sibling `models` and `mlbundle` repositories. From `playground/`:

```powershell
../../mlbundle/.venv/Scripts/python.exe scripts/export-bp-model.py
```

DoseTailor uses `/api/dosetailor/*`, proxied to `https://api.dosetailor.com/*` by both the Vite development and preview servers because the upstream API restricts browser origins. A production host serving `dist/` must provide the same proxy route; a static-only host cannot execute DoseTailor predictions. The API is called only on Predict, with a 30-second timeout, cancellation on input edits or unmount, and visible failure messages. The Labs model is selected when all optional clinical-setting, laboratory and concomitant-drug fields are complete; otherwise the No Labs model is used. Numeric category codes and the original age groups are preserved.

DoseTailor retains the original public sample values and options. It uses the playground's shared theme and MLform branding, without the original site's navigation, introductory explanation, logos, footer or extra page background.

## Production hosting

The intended URL is `https://playground.mlform.eshkra.dev`. It is a playground rather than a staging environment, so `playground` describes its role better than `test`. This address is configured but is not live until the first deployment.

Cloudflare Workers serves `dist/` and proxies the specific POST prediction endpoints used by DoseTailor and M3DISEEN. Static hosting alone is insufficient. The Worker forwards the body and upstream status, strips browser credentials, disables response caching, and bounds API calls to 30 seconds. Upstream availability still determines whether live predictions succeed; automated tests mock those services.

To activate it through GitHub Actions:

1. Keep `eshkra.dev` as an active Cloudflare zone in the deployment account.
2. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to the repository or its `playground` environment. The token needs Workers Scripts edit and the Workers Routes and DNS permissions for this zone.
3. After these changes reach `main`, run **Deploy Playground** from Actions on `main`. It verifies and builds the app, then deploys with pinned Wrangler 4.151.1. Deployment is manual and independent of npm releases.
4. Verify the public site and its real prediction APIs, then point the README and docs playground links at the live URL. Keep the package homepage at `https://eshkra.dev` and documentation at `https://ulloasp.github.io/mlform/`.

The custom domain configuration creates its DNS record and HTTPS certificate, including for a multi-level subdomain; see [Cloudflare custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/). No separate static host or manually maintained CNAME is needed.

To validate the Worker and asset bundle locally without publishing, build MLForm and the playground, then run:

```bash
vp dlx wrangler@4.151.1 deploy --dry-run --config playground/wrangler.jsonc
```
