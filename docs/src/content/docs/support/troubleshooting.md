---
title: Troubleshooting
description: Common MLForm integration problems and fixes.
---

| Problem                         | Likely cause                                | Fix                                                                      |
| ------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| Missing container               | `querySelector` returned `null`.            | Check the selector and mount after the element exists.                   |
| Missing transport               | `mountForm` needs a submit path.            | Pass `transport`.                                                        |
| Invalid transport config        | `transport.submit` is missing or invalid.   | Pass an object with an async `submit(request)` method.                   |
| Backend response cannot be read | The application adapter parsed the wrong shape. | Fix the adapter parser and return the expected report contract.      |
| Missing model inputs | A field has no backend target or is omitted as inactive. | Check `mappedTo`, `includeInSubmission`, and the inactive field policy. |
| Report stays idle | No matching backend output was routed to it. | Match the report's `mappedTo` and the envelope's `backend`; ids are not backend targets. |
| Loaded data already shows errors | Synchronous constraints run during initialization. | Correct the values or constraints; blur is not required for nonempty values. |
| Unknown field kind              | Registry does not include the field.        | Use built-ins or register a custom field.                                |
| Unknown report kind             | Registry does not include the report.       | Use `classifier`, `regressor`, or register a custom report.              |
| Duplicate id                    | Two fields or reports share an explicit id. | Give each item a stable unique id.                                       |
| Custom element name invalid     | Custom renderer tag lacks a hyphen.         | Use a valid custom element name such as `risk-band-field`.               |
| Form not updating after remount | Host reused stale schema/state.             | Keep schema creation intentional and unmount on route changes.           |
| Styles not inherited            | Design system uses its own mode.            | Use `mode: "inherit"` or override tokens at the container.               |

Start with the browser console and the network tab. Most integration failures are either schema validation, missing DOM container, or backend response shape.
