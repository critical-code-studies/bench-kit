# bench-kit

Shared modules for the critical code studies research benches: the [SHRDLU](https://critical-code-studies.github.io/SHRDLU/research/) and [Spacewar!](https://spacewar1962.github.io/spacewar/research/) benches, and those to come. Plain browser JavaScript and CSS, no build step.

## What is here

| File | What it does |
|---|---|
| `base.js` | The foundation, loaded first: the `SW` object and its helpers (`SW.$`, `SW.el`, `SW.esc`, dates, `SW.store` under the bench's prefix, `SW.on`/`SW.emit`, `SW.toast`), the side panel, popovers, dialogs closed from their backdrop, sorting tables, sharing and copying, the address bar's query, Developer mode, ghost matching, an annotation's earlier wordings and the figures packed into it (`SW.markRE` reads its hidden marks). |
| `md.js` | Rich text in annotations: Markdown shown and as plain text, rich text back to Markdown, and the note editor (`SW.mdTools`). |
| `themes.js` | How the bench looks: code text, the hands written into the text, colour schemes and themes, and figures and documents for export. |
| `about.js` | The About box (`SW.about.open()`): name, author, version and release date (the `bench-date` meta), purpose, tech stack, the kit, what is inside, sources, the catalogue of versions, code and citation, with the welcome tour; the bench's rows from `SW.BENCH.about`. |
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
| `findings.js` | Findings: the bench's own (from `SW.BENCH.findings`) and the group's, by category and importance, with the bench's checks (`SW.findings.addCheck`). |
| `compare.js` | Compare (two versions: text, the bench's second mode, routines) and Genealogy (stemma, flow with forks, tree, lineage). The second mode is the bench's (`SW.BENCH.compareDefs`). |
| `genealogy.js` | The genealogy engine: matching, matrix, tree, flows, forks, drawing. The text's language comes from an adapter. |
| `lang-plain.js` | A language adapter for any source text: the comment mark (`SW.BENCH.comment`), the pattern for a routine's first line (`SW.BENCH.routine`), case folding (`SW.BENCH.caseFold`). The template's. |
| `lang-macro.js`, `lang-maclisp.js` | Language adapters for genealogy and compare: how a line divides into labels, code and comment, its normalised form, titles, routines and sections. PDP-1 MACRO (Spacewar!), MacLisp (SHRDLU). A new language adds `lang-<name>.js` registering `SWLang[name]`. |
| `tracings.js` | Naming and colour-marking the parts of a program in a view (blocks and routines, functions), kept per version in this browser, and tracings: sets of names and marks shared with the crew through the annotation group, opened read-only (Keep as mine, Link, ✕). `SW.tracings({ ns, render, open, link, hint })`. The bench reads `&tr=` into `SW.state.trace`. |
| `readnotes.js` | Annotations in Read: threads under their lines or as cards in the margin, ghosts from other versions, the code an annotation is attached to, how notes show (with a live refresh), the selection's bar and pop, citations and links, the listing as a document, moving an annotation by dragging. `var K = SW.readNotes({ view, R, opts, isMine, showsTape, filtering, keptLines, tapeInfo, kinBar, selActs })` in the bench's `read.js`; `K.set({ build })` and `K.set({ notes })` as they change. |
| `notes.js` | Shared annotation through the bench's Hypothesis group: annotations, replies, reactions, drafts, the bin, links between annotations, codes, What's new, copies kept from ghosts (`from`), tracings, the joining guide, Help ▸ Advanced annotation. Tags carry the bench's prefix (`SW.BENCH.tag`). |
| `config.example.js` | The settings a bench gives the kit. |

## Using it in a bench

A new bench starts from [bench-template](https://github.com/critical-code-studies/bench-template), which has the kit in place and runs on an invented example.

The kit goes in as a git submodule at `research/kit/`:

```
git submodule add https://github.com/critical-code-studies/bench-kit research/kit
```

`index.html` loads `kit/base.js` first, then the bench's `config.js`, `kit/md.js` and `kit/themes.js`, then the bench's own `core.js` (its texts, builds and references: `SW.build`, `SW.refOf`, `SW.lineKey`, `SW.docMeta` …, with `root.SWVersions`), then the rest of the kit:

```html
<link rel="stylesheet" href="kit/paratexts.css?v=…">
<link rel="stylesheet" href="kit/kit.css?v=…">
<script src="kit/base.js?v=…"></script>
<script src="js/config.js?v=…"></script>
<script src="kit/md.js?v=…"></script>
<script src="kit/themes.js?v=…"></script>
<script src="js/core.js?v=…"></script>
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
  store: 'shbench.',                 // the prefix of the bench's keys in localStorage (SW.store)
  theme: { label: 'Blocks world', note: '…' },   // the default colour theme's name and description
  accent: { dark: '#e58be0', light: '#a3317a' }, // the accent of figures exported on black and on white
  about: { icon: '<svg …>', author: 'David M. Berry', citeAuthor: 'Berry, D. M.', purpose: '…', techMore: '…', inside: '…',
           sources: '…', code: 'https://github.com/…', catalogue: { skip: [], held: 'held as source' } },   // the About box (HTML in purpose, inside, sources)
  hands: [{ k: 'tw', who: 'Terry Winograd', re: /\btw\b/i, colour: '#2a9d6f' }],   // people named in the text
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

Annotations: `tag` (the prefix the bench's tags had in Hypothesis before the kit, `sw:` or `sh:`: still read, so annotations made then keep working; new tags are written `bk:` on every bench, and a new bench needs no `tag`). The bench's core should hide `<!-- bk:… -->` data comments in annotation text, as it hides its own. `joinCard` (HTML shown at the top of the joining guide), `annoHelp` (the worked examples in Help ▸ Advanced annotation: `manual`, `manualName`, `start`, `search`, `refA`, `refB`, `noteA`, `noteB`, `quoteA`, `boxA`, `boxB`, `tryText`, `code`, `caption`).

Compare and genealogy: `lang` (`macro`, `maclisp`: load `kit/lang-<lang>.js` before `kit/genealogy.js`), `compare` (`comment`, the comment character for the hover; `normalised`, offer the normalised text; `supplied`, [label, hover] of the supplied-files option; `reading`, the word for building versions), `comparePrefix` (before an export's title), `genealogy` (`set`, the versions first shown; `line`, the line of descent first shown; `lineNames`), `compareDefs` (`label`, `render(el, A, B, h)`, `doc(A, B, r, h)`; conventionally `js/compare-defs.js`).

Findings: `findings` (the list), `findingCats`, `findingsTitle`, `findingsSubtitle`, `findingsIntro` (HTML), `findingsSide` (`crew` or `bench`), `findingsRecheck`; conventionally in the bench's `js/findings-data.js`, loaded before the kit, with its checks in `js/findings-checks.js`, loaded after.

Settings texts (`settings`): `tour` (the hint beside the tour button), `groupHint` (HTML: how the bench's annotation group is set), `groupPlaceholder`, `themeHint`.

`paratexts.tokenName` may set the name given to members' GitHub tokens (by default "<name> research bench").

## Changes

The kit's own changes are in `CHANGELOG.md`. A change is made here first; each bench then takes it by moving its submodule.
