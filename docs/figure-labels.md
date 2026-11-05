# Labels over a figure

A bench with the Images tab (`images.js`) draws a figure's labels in English over the author's figure from data, as kit-built books (vector-book) draw them in print. The same entries serve both, so a label sits in the same place on the screen and on the page.

## The format

The labels file (`SW.BENCH.images.figures.overlays`) is keyed by the print file's name:

```json
{ "fig-01-p077.png": [
  { "jp": "因果的必然", "en": "causal necessity", "x": 0.0672, "y": 0.0167, "align": "left" },
  { "jp": "因果性", "en": "causality", "x": 0.3705, "y": 0.2968, "anchor": "center", "angle": 45 }
] }
```

| Field | |
|---|---|
| `jp` | the source's word the label renders (shown when the pointer is over the label) |
| `en` | the label; a line break where it is to break |
| `x`, `y` | fractions of the print file's width and height |
| `align` | `left` (the default): the label's left edge at `x`; `right`: its right edge at `x`. Its top is at `y` |
| `anchor` | `center`: the label's centre at `x`, `y`, whatever `align` says |
| `angle` | degrees, clockwise, about the anchor point (the centre, or the top corner at `x`) |

A figure whose record in `figures.json` says `"overlays": false` is shown without labels, whatever the labels file holds, and its caption's key is shown beside it. The PNG and SVG exports draw the labels as the screen does, rotation included.

## Placing them

Rules approved by David, 2026-11-05, for any figure:

1. A label for a word set along a diagonal runs along the line, beside the half where the word begins, centred on that half, short of the crossing, on the side away from the author's characters.
2. A label for a word set vertically beside the figure runs vertically beside it, outside the drawing, reading downwards (`angle: 90`).
3. Paired labels sit at the same height.

A word written a character at a time along a line has one label, so some of the source's characters have none of their own; `images.labelsNote` and a figure's own `labelsNote` say so in the figure's box (About the labels).
