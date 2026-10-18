---
title: Versioning
description: How the documentation tracks MLForm versions.
---

The [published docs](https://docs.mlform.eshkra.dev/) and
[playground](https://playground.mlform.eshkra.dev/) deploy automatically after **CI & Publish**
successfully publishes a new package version to npm from `main`. Both use artifacts built and
verified in that CI run. An unchanged version or failed npm publication does not deploy either site.
Deployment jobs can fail independently; check their results before treating a release as fully deployed.

Documentation in a local checkout can describe unreleased work. Use the installed package version
and its release notes when comparing an application with these docs. Public package surfaces,
examples, runtime behavior, and rendered behavior should describe the same contract at release time.

MLForm is pre-1.0. Review release notes for changes to schemas, validation, serialization, and
rendering before upgrading. Compatibility is an explicit product decision; a new version should
make any changed contract visible rather than keeping an undocumented fallback.

Most reference pages are written by hand. Some parts are generated from the code when the docs are
built: the export lists in [Package exports](/reference/package-exports/), the token tables in
[Tokens](/design/tokens/#token-reference), and the configurations shown next to screenshots. The
screenshots are produced by running the code they show (`playground/scripts/capture-docs.ts` and
`capture-landing.ts`). Other Markdown examples are not executed by the docs build, so contributors
verify changed examples against the public package.

- [npm package and versions](https://www.npmjs.com/package/mlform)
- [GitHub releases](https://github.com/UlloaSP/mlform/releases)
- [Legacy API migration](/migration/from-legacy-mlform/)
