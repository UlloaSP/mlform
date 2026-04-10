---
title: Troubleshooting
description: Common MLForm integration problems and fixes.
---

| Problem                         | Likely cause                                              | Fix                                                            |
| ------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| Missing container               | `querySelector` returned `null`.                          | Check the selector and mount after the element exists.         |
| Missing endpoint or transport   | `mountForm` needs a submit path.                          | Pass `endpoint` or `transport`.                                |
| Conflicting transport config    | Both custom `transport` and endpoint options were passed. | Use one transport strategy.                                    |
| Backend returned non-JSON       | Default parser expects JSON.                              | Return JSON or provide `transportOptions.parse`.               |
| Unknown field kind              | Registry does not include the field.                      | Use built-ins or register a custom field.                      |
| Unknown report kind             | Registry does not include the report.                     | Use `classifier`, `regressor`, or register a custom report.    |
| Duplicate id                    | Two fields or reports share an explicit id.               | Give each item a stable unique id.                             |
| Custom element name invalid     | Custom renderer tag lacks a hyphen.                       | Use a valid custom element name such as `risk-band-field`.     |
| Form not updating after remount | Host reused stale schema/state.                           | Keep schema creation intentional and unmount on route changes. |
| Styles not inherited            | Design system uses its own mode.                          | Use `mode: "inherit"` or override tokens at the container.     |

Start with the browser console and the network tab. Most integration failures are either schema validation, missing DOM container, or backend response shape.
