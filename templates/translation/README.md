# A translation research bench

A research bench for reading a translation made by the [vector translation method](https://github.com/vector-humanities/vector-translation) beside its source: the source's page images beside the literal and readable translations, held at the same page; the glossary as a concordance; the change lists by origin, and whether each change is in the text now; a source word looked for in the source's OCR and in the translations. Built on [bench-kit](https://github.com/critical-code-studies/bench-kit), from its `templates/translation/`.

This is the template, with an invented example. Every value marked `EDIT` in `js/config.js` and `js/versions.js` is the example's.

## What is here

| Path | What |
|---|---|
| `index.html` | the bench's page: its tabs, views and scripts |
| `js/config.js` | the bench's settings (`SW.BENCH`), the translation's descriptor among them |
| `js/versions.js` | the texts held: literal, readable, the source's OCR, and their files |
| `js/core.js` | how a file is read: bench-kit's `vt-reader.js`, the lines and Book's document |
| `js/main.js`, `js/read.js`, `js/tour.js` | the views in tab order, Read's settings, the tour |
| `js/images.js` | the source's images and their IIIF services (`kit/tools/iiif-map.js`) |
| `text/literal/`, `text/readable/` | the translation, a snapshot of its repository at a commit |
| `glossary.csv`, `checks/` | the glossary and the change lists |
| `source/ocr.txt` | the source's OCR, divided by image (`=== PAGE n`) |
| `library/library.json` | the Library: public texts for wider reading, held in `library/files/` or linked to |
| `tests/` | the kit's tests, with this bench's values |
| `kit/` | bench-kit, a git submodule |

## The descriptor

`SW.BENCH.translation` says where the translation departs from the method's layout: the versions' ids, the page and image markers, where the apparatus begins, the glossary, the change lists, the OCR, and which half of a spread a page is on. `kit/vt-reader.js` lists every field.

## Working copy

File ▾ ▸ Open a folder… reads a working copy of the translation's repository on this computer in place of the published files, work not yet committed included, without a token.

## Licence

The bench's own files: choose a licence and put it in `LICENSE`. bench-kit is GPL-3.0.
