# bench-kit

Shared modules for the critical code studies research benches: the [SHRDLU](https://critical-code-studies.github.io/SHRDLU/research/) and [Spacewar!](https://spacewar1962.github.io/spacewar/research/) benches, and those to come. Plain browser JavaScript and CSS, no build step.

## What is here

| File | What it does |
|---|---|
| `paratexts.js` | The Paratexts tab: a private GitHub repository of scans, documents, recordings and links, read and written with each member's own token; collections, Dublin Core, CSL-JSON, RIS and oai_dc export, ratings, comments, side by side, zoom, codes (P-XXXXX). |
| `guides.js` | Help guides (Paratexts; Codes, links and sharing) in a box over the bench, and `SW.guideAdd(name, [title, sections])` for a bench's own. |
| `paratexts.css` | Their styles, using the bench's colour tokens. |
| `config.example.js` | The settings a bench gives the kit. |

## Using it in a bench

The kit goes in as a git submodule at `research/kit/`:

```
git submodule add https://github.com/critical-code-studies/bench-kit research/kit
```

`index.html` loads the bench's `config.js` before the kit, and the kit after the bench's core (`SW`, `SW.store`, `SW.el`, `SW.esc`, `SW.toast`, `SW.share`, `SW.askInitials`, `SW.notes`, `SW.tray`, `SW.views`, `root.SWVersions`):

```html
<link rel="stylesheet" href="kit/paratexts.css?v=…">
<script src="js/config.js?v=…"></script>
…
<script src="kit/paratexts.js?v=…"></script>
<script src="kit/guides.js?v=…"></script>
```

To take a newer kit: `git submodule update --remote research/kit`, test, and commit the new pointer. A clone needs `git clone --recurse-submodules` (or `git submodule update --init`). GitHub Pages fetches public submodules when it builds.

## The settings (`SW.BENCH`)

```js
SW.BENCH = {
  name: 'SHRDLU',                    // as in "the SHRDLU research bench"
  title: 'SHRDLU Research Bench',
  relation: 'SHRDLU, ',              // put before a version's label in Dublin Core relation
  topShare: false,                   // the bench has a share button in its top bar
  paratexts: { org: 'critical-code-studies', repo: 'shrdlu_paratexts', cache: 'shrdlu-paratexts' },
  examples: { date: 'e.g. 1971-01-15, or 1971', archive: 'e.g. MIT Museum', versions: 'e.g. mit, stanford',
              refs: 'e.g. [REF: SHI, plnr.182:120]', publisher: 'e.g. MIT Press', finding: 'F2' }
};
```

`paratexts.tokenName` may set the name given to members' GitHub tokens (by default "<name> research bench").

## Changes

The kit's own changes are in `CHANGELOG.md`. A change is made here first; each bench then takes it by moving its submodule.
