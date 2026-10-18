---
title: Accessibility
description: What the built-in controls do for keyboard, screen reader, motion, and forced-colors users, and what remains your responsibility.
---

Accessibility is part of each built-in control's contract, not an option. The schema supplies the
words; the controls supply semantics and behavior.

## What the built-in UI provides

- **Names and descriptions.** Every control is named by its field `label`. A `description` sits
  behind a help button and is linked to the control; `showDescriptionInline` shows it expanded.
  Errors and status messages are announced through the control's description.
- **Native semantics.** Text and numbers are inputs, categories are selects, `boolean`,
  `single-choice`, and `rating` are radio groups, `multi-choice` is a group of checkboxes. Numeric
  inputs expose spinbutton semantics and step with the arrow keys; rating supports arrow keys,
  Home, and End.
- **Feedback beyond color.** Errors are text plus an outlined frame; success is text plus a check
  mark.
- **Read-only and disabled.** Read-only text and numbers stay focusable so values can be selected
  and copied; disabled controls are skipped by Tab.
- **Focus on failure.** `mounted.submit()` and the built-in submit button reveal the first invalid
  field, open the section, tab, or wizard step that contains it, and focus it.
- **Series editing.** Adding a row focuses its first cell; removing a row moves focus to a nearby
  control so it is never lost.
- **Reports.** Each report is a labelled region; loading, skipped, and error states are text.
  Custom reports that draw SVG should give it `role="img"` and an `aria-label`, as the
  [forecast chart example](/extend/custom-reports/) does.
- **Motion and contrast.** Description and feedback transitions follow the recipe's motion setting
  and `prefers-reduced-motion`. In forced-colors mode, outlines, focus indicators, and selected
  states remain visible.

## What stays with your application

| Area | Your responsibility |
| --- | --- |
| Copy | Meaningful labels, option labels, and descriptions for constraints people need before typing. |
| Errors | Actionable messages from your validators and backend. |
| Page structure | Landmarks, headings around the form, and route-level focus after navigation. |
| Custom renderers | Labels, keyboard support, and focus for anything you render with `createFormView` or a custom element. |
| Theme overrides | Contrast of colors you set through tokens; do not rely on color alone. |
| Host focus | Do not trap focus around the mounted element. |

Headless rendering through [`createFormView`](/view/overview/) gives you state and descriptors, not
DOM behavior: focusing the first invalid field, for example, is your code's job there. Using
[`createPrimitiveAdapter`](/kit/primitive-adapter/) keeps the built-in controls, and their
behavior, inside your layout.
