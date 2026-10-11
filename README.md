# bench-kit

Shared modules for the critical code studies research benches: the [SHRDLU](https://critical-code-studies.github.io/SHRDLU/research/) and [Spacewar!](https://spacewar1962.github.io/spacewar/research/) benches, and those to come. Plain browser JavaScript and CSS, no build step.

## What is here

| File | What it does |
|---|---|
| `paratexts.js` | The Paratexts tab: a private GitHub repository of scans, documents, recordings and links, read and written with each member's own token; collections, Dublin Core, CSL-JSON, RIS and oai_dc export, ratings, comments, side by side, zoom, codes (P-XXXXX). |
| `guides.js` | Help guides (Paratexts; Codes, links and sharing) in a box over the bench, and `SW.guideAdd(name, [title, sections])` for a bench's own. |
| `paratexts.css` | Their styles, using the bench's colour tokens. |
| `export.js` | Word (.docx), Markdown and file downloads (`root.SWExport`). |
| `tray.js` | My notes: notes, figures and excerpts gathered for writing, shared to Findings, exported; backup and restore of the bench. |
| `figures.js` | Figures of code and of the screen, as SVG and PNG. |
| `stemma.js` | The stemma of the bench's versions, from `SWVersions`. |
| `edition.js` | A reading edition of a version, to read, print or save as Word. |
| `tours.js` | The guided tour; its stops are the bench's (`SW.BENCH.tours`). |
| `initials.js` | The box that asks for initials (two to four letters) when something is to be signed: `SW.askInitials(why)`, `SW.withInitials(why)`. |
| `settings.js` | ⚙ Settings, in tabs (You, Annotations, Paratexts, Display, Developer): `SW.settings.open(tab)`; a bench adds rows with `SW.settings.add({ tab, html, load, save })`. The bench gives its theme function as `SW.setTheme`. |
| `kit.css` | Styles for the initials box and Settings. |
| `config.example.js` | The settings a bench gives the kit. |

## Using it in a bench

The kit goes in as a git submodule at `research/kit/`:

```
git submodule add https://github.com/critical-code-studies/bench-kit research/kit
```

`index.html` loads the bench's `config.js` before the kit, and the kit after the bench's core (`SW`, `SW.store`, `SW.el`, `SW.esc`, `SW.toast`, `SW.share`, `SW.askInitials`, `SW.notes`, `SW.tray`, `SW.views`, `root.SWVersions`):

```html
<link rel="stylesheet" href="kit/paratexts.css?v=…">
<link rel="stylesheet" href="kit/kit.css?v=…">
<script src="js/config.js?v=…"></script>
<script src="kit/initials.js?v=…"></script>
<script src="kit/settings.js?v=…"></script>
…
<script src="kit/paratexts.js?v=…"></script>
<script src="kit/guides.js?v=…"></script>
```

Each kit module takes the place of the bench file of the same name (`js/tray.js` becomes `kit/tray.js`, and so on), in the same position. The bench's tour stops go in its own `js/tour.js`, loaded before `kit/tours.js`.

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

Further settings, used by the modules other than paratexts:

```js
  slug: 'shrdlu',                    // file names (shrdlu-my-notes-…json) and backup kinds
  store: 'shbench.',                 // the prefix of the bench's keys in localStorage (as core.js's SW.store)
  group: '1Kb3vwEV',                 // the annotation group to use when none is set
  figureNum: { print: '#a3317a', paper: '#a3317a', phosphor: '#e58be0' },   // numbers in figures, per figure theme
  stemma: { root: 'jan71', lostBetween: {}, skip: [], lostOnTrunk: true },
  edition: {
    source: function (p) { return ''; },              // a note after each source file
    built: function (b) { return ['Read as', '…']; }, // the row saying how the text was read or assembled
    layout: function (raw, pad) { return raw; },      // a line as set on the page
    words: false,                                     // offer "addresses & words"
    files: ['all files', 'Include the support and documentation files']   // the label and hover of that option
  }
```

Settings texts (`settings`): `tour` (the hint beside the tour button), `groupHint` (HTML: how the bench's annotation group is set), `groupPlaceholder`, `themeHint`.

`paratexts.tokenName` may set the name given to members' GitHub tokens (by default "<name> research bench").

## Changes

The kit's own changes are in `CHANGELOG.md`. A change is made here first; each bench then takes it by moving its submodule.
