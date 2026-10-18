---
title: Themes And Recipes
description: Configure MLForm appearance through built-in themes and recipes.
---

MLForm separates color theme from layout recipe.

Without a `designSystem` option, the kit uses the `neutral` theme and `default` recipe. Keyboard focus highlights the active control. Field frames retain their outline while editing; a visible validation error gives the frame a danger outline. Nonempty values show synchronous validation feedback immediately, including defaults and loaded examples. Valid editable fields have a subtle success outline and a check mark; empty untouched fields remain quiet. Read-only and disabled inputs use muted text and a distinct background, without an editing caret. Read-only text and numeric inputs remain focusable for selecting and copying their values. See [Validation](/guides/validation/) for asynchronous and form-level checks.

Feedback reserves one line and animates additional height when messages wrap. Description expansion and feedback transitions follow the motion setting and respect `prefers-reduced-motion`. Forced-colors mode retains control outlines, keyboard focus and boolean selection.

Themes:

- `eshkra`
- `m3diseen`
- `dosetailor`
- `neutral`
- `cobalt`
- `graphite`
- `sage`
- `sunset`
- `airbnb`
- `clickhouse`

The `eshkra` theme uses neutral surfaces, orange accents, Mona Sans for interface text and JetBrains Mono for code. It includes light and dark schemes. Load those fonts in your host application or let the theme fall back to system fonts; the library does not download fonts. The playground loads them locally and starts with `eshkra`, the `default` recipe and `auto` mode. Saved playground preferences take precedence.

The `m3diseen` and `dosetailor` themes use Quicksand and the palettes of [M3DISEEN](https://m3diseen.com/) and [DoseTailor](https://dosetailor.com/tacrolimusv1). Their light schemes retain the original lavender backgrounds and white surfaces; their dark schemes are MLForm adaptations. Action and focus colors are adjusted for readable contrast where needed. Load Quicksand in the host application when using these themes. The playground serves its licensed font locally. Its menu, floating button and device preview follow the selected theme and appearance, including system changes in `auto` mode.

Recipes:

- `default`
- `minimal`
- `soft`
- `contrast`

```ts
import { predictionTransport } from "./prediction-transport";

mountForm(container, {
  transport: predictionTransport,
  schema,
  designSystem: {
    mode: "auto",
    theme: "graphite",
    recipe: "contrast",
  },
});
```

Modes are `light`, `dark`, `auto`, and `inherit`. Density options are `compact`, `comfortable`, and `spacious`. Motion options are `none`, `subtle`, and `standard`.
