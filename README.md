# bench-kit

**Author:** David M. Berry  
**Version:** 0.44.1

Shared modules for the critical code studies research benches: the [SHRDLU](https://critical-code-studies.github.io/SHRDLU/research/) and [Spacewar!](https://spacewar1962.github.io/spacewar/research/) benches, and those to come. Plain browser JavaScript and CSS, no build step.

## What is here

| File | What it does |
|---|---|
| `base.js` | The foundation, loaded first: the `SW` object and its helpers (`SW.$`, `SW.el`, `SW.esc`, dates, `SW.store` under the bench's prefix, `SW.on`/`SW.emit`, `SW.toast`), the side panel, popovers, dialogs closed from their backdrop, sorting tables, sharing and copying, the address bar's query, Developer mode, ghost matching, an annotation's earlier wordings and the figures packed into it (`SW.markRE` reads its hidden marks).; `SW.flip`, a two-state switch for a toolbar (the state shown, a click for the other, kept for the bench). |
| `md.js` | Rich text in annotations: Markdown shown and as plain text, rich text back to Markdown, and the note editor (`SW.mdTools`). |
| `themes.js` | How the bench looks: code text, the hands written into the text, colour schemes and themes, and figures and documents for export. |
| `shell.js` | The bench's frame, loaded last: start-up, the version picker, the tabs and the views drawn in them, the colour theme, the top bar's buttons, and what a link asks for (`?v=`, `&tab=`, `&l=`, `&b=`, `&a=`, `&code=`, `&help=`, `&tour=`, `&join=`, `&tr=`). `SW.setTab`, `SW.select`, `SW.forget`, `SW.setTheme`, `SW.markTabs`, `SW.help(name)`. The bench's parts from `SW.BENCH.shell`. |
| `menus.js` | The drop-down menus in the tab row: Versions ▾ and Help ▾, and the bench's own (lenses, graphics), from `SW.BENCH.menus`. |
| `version.js` | Versions ▸ This version (the view `about`): a version's record, its place in the variorum, its annotations and build log, the bin, every annotation on every version; the bench's own rows from `SW.BENCH.version`. |
| `versionlist.js` | A bench's list of versions from its records (`js/versions.js`): each version's link, its descent (parent, witness, also, influence), the chain to any version, the lines of descent, and loading a version's files (`SWVersionList`, in the browser and Node). |
| `builds.js` | A bench's texts fetched and built, the unit every view reads: `SW.fetchText`, `SW.fetchBytes`, `SW.build(id, extra)` (cached), `SW.current()`, `SW.openAt(vid, a)`, `SW.docMeta(b)`, `SW.oct`. The bench says how a version is read: `SW.builds({ read, split, key, meta })` in its `js/core.js`. |
| `refs.js` | References to the sources (`SW.refOf`, `SW.refText`, `SW.refTag`, `SW.cite`, `SW.nparts`), the files on GitHub (`SW.sourceURL`, `SW.sourceLink`, `SW.permalinkOf`), and their SWHIDs (`SW.swhidOf`, `SW.swhidCite`, `SW.swhidList`, `SW.swhidTiny`, `SW.filesOf`, `SW.ownFilesOf`), from `SW.BENCH.refs`. |
| `about.js` | The About box (`SW.about.open()`): name, author, version and release date (the `bench-date` meta), purpose, tech stack, the kit, what is inside, sources, the catalogue of versions, code and citation, with the welcome tour; the bench's rows from `SW.BENCH.about`. |
| `paratexts.js` | The Paratexts tab: a private GitHub repository of scans, documents, recordings and links (a PDF drawn a page at a time by Mozilla's PDF.js, fetched from cdnjs the first time one is opened, to zoom and move as a picture is), read and written with each member's own token; collections, Dublin Core, CSL-JSON, RIS and oai_dc export, ratings, comments, side by side, zoom, codes (P-XXXXX). |
| `graphics.js` | The Graphics tab: pictures of the program, one at a time, chosen from the view's heading and from Graphics ▾ in the tab row (in groups, two columns); `&g=` in a link; an animation stopped when another graphic is chosen; an export where the picture gives one. `SW.setGraphic(id)`, `SW.openGraphic(id)`, `SW.gfxItem()`, `SW.graphics.render()`. The pictures are the bench's, from `SW.BENCH.graphics` (hooks, below). |
| `lenses.js` | The Analyse view: lenses on a version, each a set of cards with its own export and a stable number; a second mode across the versions where the bench gives one; the lens menus in the tab row (Text ▾, Program ▾ …) and the Versions items that open a lens; the Functional overview and a name's history as lenses. `SW.openLens(n)`, `SW.setLens(n)` (a link's `&lens=`), `SW.anLens()`, `SW.anLensName()`, `SW.lenses.render()`, and the cards' parts `SW.lenses.card(title, lede)`, `wide`, `bars`, `expMenu`. The lenses themselves are the bench's, from `SW.BENCH.lenses` (hooks, below). |
| `helppages.js` | Three Help pages from the bench's data: Referencing and versions (`SW.refHelp`, `SW.refList`: the form of reference, the versions and ports, to copy or export with their SWHIDs), What you should read (`SW.readingHelp`), and Reconstruction cards (`SW.cardsHelp`, `SW.cardsOne(vid)`, `SW.cardHTML(v, { about })`: what the bench does to each version to read and run it, to copy, export as Word, Markdown, PNG or SVG, or keep in My notes). From `SW.BENCH.refHelp`, `reading` and `cards`. |
| `guides.js` | Help guides (Paratexts; Codes, links and sharing) in a box over the bench, and `SW.guideAdd(name, [title, sections])` for a bench's own. |
| `paratexts.css` | Their styles, using the bench's colour tokens. |
| `export.js` | Word (.docx), Markdown and file downloads (`root.SWExport`). |
| `tray.js` | My notes: notes, figures and excerpts gathered for writing, shared to Findings, exported; backup and restore of the bench. |
| `figures.js` | Figures of code and of the screen, as SVG and PNG; `SW.beam(s)`, a display intensity as an opacity (a bench may set its own). |
| `stemma.js` | The stemma of the bench's versions, from `SWVersions`. |
| `edition.js` | A reading edition of a version, to read, print or save as Word. |
| `tours.js` | The guided tour; its stops are the bench's (`SW.BENCH.tours`). |
| `initials.js` | The box that asks for initials (two to four letters) when something is to be signed: `SW.askInitials(why)`, `SW.withInitials(why)`. |
| `settings.js` | ⚙ Settings, in tabs (You, Annotations, Paratexts, Display, Developer): `SW.settings.open(tab)`; a bench adds rows with `SW.settings.add({ tab, html, load, save })`. The bench gives its theme function as `SW.setTheme`. |
| `bench.css` | The styles every bench shares: the frame (top bar, tabs, views, dialogs, menus, the side panel) and the kit's views. Loaded before `themes.css` and the bench's own `css/research.css`, which sets the bench's default colours (the custom properties on `:root`) and its own parts, and can override any rule here. |
| `themes.css` | The colour themes offered in Settings (listing paper, white, sepia, green and amber terminal, high contrast) as sets of custom properties, with the type, the menus' panel, the gold of repairs (`--kin`, `--kin-bg`), the annotation marks and the genealogy figures' colour schemes. A bench changes a token of a theme by repeating its selector in `css/research.css` (Spacewar sets its own accent: `--amber`, `--hl`, `--noted-bg`). |
| `kit.css` | Styles for the kit's own parts: the initials box, Settings, the About box, tracings, the Functional overview. |
| `functional.js` | A Functional overview of a version: where the program starts and what it calls, start-up, the parts of the program and the calls between them, read from the source; with a second mode, Recorded run, where the bench can run its program. `SW.functionalOverview.render(b, el, { inline })`, or the view `functional` on a page with `#view-functional`. Its hooks: below. |
| `findings.js` | Findings: the bench's own (from `SW.BENCH.findings`) and the group's, by category and importance, with the bench's checks (`SW.findings.addCheck`). |
| `compare.js` | Compare (two versions: text, the bench's second mode, routines) and Genealogy (stemma, flow with forks, tree, lineage). The second mode is the bench's (`SW.BENCH.compareDefs`). |
| `genealogy.js` | The genealogy engine: matching, matrix, tree, flows, forks, drawing. The text's language comes from an adapter. |
| `lang-plain.js` | A language adapter for any source text: the comment mark (`SW.BENCH.comment`), the pattern for a routine's first line (`SW.BENCH.routine`), case folding (`SW.BENCH.caseFold`). The template's. |
| `lang-macro.js`, `lang-maclisp.js` | Language adapters for genealogy and compare: how a line divides into labels, code and comment, its normalised form, titles, routines and sections. PDP-1 MACRO (Spacewar!), MacLisp (SHRDLU). A new language adds `lang-<name>.js` registering `SWLang[name]`. |
| `lang-mad.js` | MAD with SLIP (CTSS, the IBM 7094), FAP (the 7094's assembler) and the ELIZA scripts written for them, for genealogy, compare and a bench's Read: a card's label, remark (R in column 11, 12 or 13), continuation and sequence number; a deck's head, MAD or FAP; a FAP card's label, operation and address (`parseFap`, `fapTokens`); MAD's keywords whole and short (W'R, T'O), `$text$`, dotted relations, `NAME.(…)` calls (`tokens`); a script's lists, comments, `=` references and `/` classes (`scriptTokens`). A routine is a deck, an internal function or a script's keyword entry. A file not named `.mad` is read as a script. From the ELIZA bench; `SW.BENCH.lang = 'mad'`. |
| `tracings.js` | Naming and colour-marking the parts of a program in a view (blocks and routines, functions), kept per version in this browser, and tracings: sets of names and marks shared with the crew through the annotation group, opened read-only (Keep as mine, Link, ✕). `SW.tracings({ ns, render, open, link, hint })`. The bench reads `&tr=` into `SW.state.trace`. |
| `read.js` | Read: a version's files line by line, with the group's annotations (`readnotes.js`), a search, the file picker, the View options and filters, ↶ ↷, the Key, the pop-up on a name (`SW.symbolRefs` lists where a name is defined and used), the side panel of a line's annotations and the export. `var ctx = SW.readView(H)` in the bench's `js/read.js`, with what is the bench's (hooks, below). |
| `catalogue.js` | A catalogue of what is known to have existed, held here or not (`SW.BENCH.catalogue`): a table with a search, filters, sorting and named subsets, each entry linked to the versions the bench holds of it, and a column for whether an entry is in the source the catalogue follows. A subset can turn the genealogy's flow to its line and, with `layers.js`, narrow Read ▾. See the head of `catalogue.js`. |
| `layers.js` | Code in layers, for a bench whose texts run on or call others (`SW.BENCH.layers`: ELIZA's scripts run on ELIZA, which calls SLIP): the version chosen in each layer, names looked up down the layers, Read ▾ listing each layer and its versions (with a layer's own items, `more`, and the bench's choice of them, `shown`), ◀ ▶ through where Read has been (`SW.nav`), the breadcrumb, and the words of a layer that the layer below acts on (`forms`). Loaded after the bench's `main.js`, before `shell.js`; a bench without `layers` is left as it is. |
| `kintsugi.js` | The repairs in Read, in gold, after kintsugi (Berry 2025), for a bench that reads a version otherwise than it is held: the ◆ ‹ › stepper, the repairs bar (the list, Only the repaired lines, My notes, Copy, the cards, what the marks mean), View ▸ Repairs (gold), and the squiggle under a repaired line. `SW.kintsugi(cfg)` gives `SW.readView` its `repairs`; `SW.kintsugi.wrapChars`, `diffSpan`, `squiggle`, `measure` for the bench's marks (hooks, below). |
| `readnotes.js` | Annotations in Read: threads under their lines or as cards in the margin, ghosts from other versions, the code an annotation is attached to, how notes show (with a live refresh), the selection's bar and pop, citations and links, the listing as a document, moving an annotation by dragging. `var K = SW.readNotes({ view, R, opts, isMine, showsTape, filtering, keptLines, tapeInfo, kinBar, selActs })` in the bench's `read.js`; `K.set({ build })` and `K.set({ notes })` as they change. |
| `notes.js` | Shared annotation through the bench's Hypothesis group: annotations, replies, reactions, drafts, the bin, links between annotations, codes, What's new, copies kept from ghosts (`from`), tracings, the joining guide, Help ▸ Advanced annotation. Tags carry the bench's prefix (`SW.BENCH.tag`). |
| `config.example.js` | The settings a bench gives the kit. |

## Using it in a bench

A new bench starts from [bench-template](https://github.com/critical-code-studies/bench-template), which has the kit in place and runs on an invented example.

The kit goes in as a git submodule at `research/kit/`:

```
git submodule add https://github.com/critical-code-studies/bench-kit research/kit
```

`index.html` loads the version list first (`kit/versionlist.js`, then the bench's `js/versions.js`, which sets `root.SWVersions`), then `kit/base.js`, then the bench's `config.js`, `kit/md.js`, `kit/themes.js`, `kit/refs.js` and `kit/builds.js`, then the bench's own `core.js` (how it reads its texts: `SW.builds({ read … })`, `SW.parseLine`, `SW.lineKey` …), then the rest of the kit and the bench's views, and last the bench's `main.js` (its parts of the frame) and `kit/shell.js`:

```html
<link rel="stylesheet" href="kit/bench.css?v=…">
<link rel="stylesheet" href="kit/themes.css?v=…">
<link rel="stylesheet" href="css/research.css?v=…">
<link rel="stylesheet" href="kit/paratexts.css?v=…">
<link rel="stylesheet" href="kit/kit.css?v=…">
<script src="kit/versionlist.js?v=…"></script>
<script src="js/versions.js?v=…"></script>
<script src="kit/base.js?v=…"></script>
<script src="js/config.js?v=…"></script>
<script src="kit/md.js?v=…"></script>
<script src="kit/themes.js?v=…"></script>
<script src="kit/refs.js?v=…"></script>
<script src="kit/builds.js?v=…"></script>
<script src="js/core.js?v=…"></script>
<script src="kit/initials.js?v=…"></script>
<script src="kit/settings.js?v=…"></script>
…
<script src="kit/paratexts.js?v=…"></script>
<script src="kit/guides.js?v=…"></script>
<script src="kit/helppages.js?v=…"></script>
<script src="kit/about.js?v=…"></script>
<script src="js/main.js?v=…"></script>
<script src="kit/shell.js?v=…"></script>
```

Each kit module takes the place of the bench file of the same name (`js/tray.js` becomes `kit/tray.js`, and so on), in the same position. The bench's tour stops go in its own `js/tour.js`, loaded before `kit/tours.js`.

To take a newer kit: `git submodule update --remote research/kit`, test, and commit the new pointer. A clone needs `git clone --recurse-submodules` (or `git submodule update --init`). GitHub Pages fetches public submodules when it builds.

## What a bench provides

**Versions** (`js/versions.js`, `root.SWVersions`): `VERSIONS` (each `{ id, label, date, sort, authors, fork, status, medium, summary, build: [{ src, role }], parent, witnessOf, also, influence }`; `role` is `program`, `support`, `doc` or `text` (a witness read and compared as plain text: a transcript, a conversation, a log); a lost version has no `build`), `byId(id)`, `load(v, fetchText)`, `SRC` (where the sources are), `LINES` (lines of descent: `{ id, label, tip, ids }`; a line may give `ids` itself, in order, in place of `tip` where no descent is known), `ancestry(id)`, `DIALECTS`, `TRANSFORMS`. These come from `kit/versionlist.js`, which the bench gives its records: `SWVersionList({ versions, src, dialects, transforms, parent, witness, also, influence, lines, load, findTitle, extra })`, with `parent` and `witness` as `{ id: id }`, `also` and `influence` as `{ id: [id] }`, and `load` and `findTitle` only where the bench reads its files otherwise; `SWVersionList.files(dir, list)` makes a version's `build`. In Node the bench's `js/versions.js` requires `../kit/versionlist.js`.

**Builds** (`SW.build(id)`, a promise; `kit/builds.js` fetches and caches them, the bench's `js/core.js` reads them through `SW.builds({ read(v, L, extra), split, key(v, extra), meta(b) })`): `{ v, parts: [{ src, role, raw }], lines: [[{ p, n, raw, norm }] per file], errorsAt: { 'p:n': [...] }, kind: { 'p:n': 'def' | 'com' | … }, asm }` (`asm` is null where the bench neither assembles nor indexes; Read, the edition and the figures show addresses and words where it holds `byLine`).

**Functions** the kit calls (the bench's `js/core.js`): `SW.parseLine(raw)` (`{ labels, loc, code, comment }`), `SW.lineKey`, and `SW.REF` (the versions' short names, where `SW.BENCH.refs.names` does not give them). The references, the frame (`SW.select`, `SW.setTab`, `SW.forget`, `SW.setTheme`) and the menus are the kit's. Used where present: `SW.anLens`, `SW.anLensName`, `SW.openLens`, `SW.openGraphic`, `SW.gfxItem`, `SW.gzQuery`, `SW.tape`, `SW.beam`. `SW.views.read` (the bench's Read) gives `build`, `goto`, and through `readnotes.js` `notesMenu` and `listingDoc`.

**State** (`SW.state`): `v` (the version open), `tab`, `sel` (`{ p, n0, n1 }`), `b` (Compare's other version), `trace` (a tracing to open, from `?tr=`).

**The page** (`index.html`): `#bench-ver`, `#status`, `#btn-settings`, `#btn-news` with `#news-n`, and a section for each of the kit's views: `#view-compare`, `#view-genealogy`, `#view-findings`, `#view-notes`, `#view-paratexts`, `#view-functional` (optional). The bench's Read makes `#rd-selbar` and `#rd-notes-mode`. The kit makes the side panel (`#drawer`), the annotate dialog (`#dlg-note`, its tags' example from `SW.BENCH.tagsHint`) and the toast (`#toast`), after the page's `<main>`, and its own dialogs (Settings, About, initials, figures, findings). The template's `index.html` has all of these.

## The settings (`SW.BENCH`, the bench's `js/config.js`)

The bench and its files:

```js
SW.BENCH = {
  name: 'SHRDLU',                    // as in "the SHRDLU research bench"
  title: 'SHRDLU Research Bench',    // the page and the About box
  slug: 'shrdlu',                    // file names of exports and backups
  store: 'shbench.',                 // the prefix of the bench's keys in localStorage (SW.store)
  group: '1Kb3vwEV',                 // the Hypothesis group to use when none is set
  relation: 'SHRDLU, ',              // put before a version's label in Dublin Core relation
  topShare: false,                   // the bench has a share button in its top bar
  tag: 'sh:',                        // the prefix its tags had before bench-kit 0.5.0 (still read; new tags are bk:). A new bench: 'bk:'
  // the bench template's core.js also reads base (SW.BASE_URI), repo, ref, refPrefix, forks, start
};
```

| Setting | Read by | What it is |
|---|---|---|
| `about` | `about.js` | The About box's own rows: `icon` (HTML), `author`, `citeAuthor`, `purpose`, `techMore`, `inside`, `sources` (HTML), `code` (the repository), `catalogue: { skip: [ids], held: 'held as source' }`. |
| `theme` | `themes.js` | The default colour theme's `label` and `note`. |
| `accent` | `themes.js` | `{ dark, light }`: the accent of figures exported on black and on white. |
| `hands` | `themes.js`, `compare.js` | People named in the text: `[{ k, who, re, colour }]`. |
| `figureNum` | `figures.js` | Numbers in figures, by figure theme: `{ print, paper, phosphor }`. |
| `settings` | `settings.js` | Texts in ⚙ Settings: `tour`, `groupHint` (HTML), `groupPlaceholder`, `themeHint`. |
| `joinCard` | `notes.js` | HTML at the top of the joining guide. |
| `tagsHint` | `shell.js` | Examples of tags, shown in the annotate dialog's Tags field. |
| `annoHelp` | `notes.js` | The worked examples in Help ▸ Advanced annotation: `manual`, `manualName`, `start`, `search`, `refA`, `refB`, `noteA`, `noteB`, `quoteA`, `boxA`, `boxB`, `tryText`, `code`, `caption`. |
| `freshness` | `shell.js` | `false` to stop the bar that offers to reload when a newer release is live. |
| `textNote` | `genealogy.js` | The mark that opens a transcriber's note in a part read as text (role `text`), set aside from the comparisons: `';'` on the ELIZA bench. |
| `catalogue` | `catalogue.js` | `{ view, store, title, intro, foot, noun, rows, key, held, columns, search, facets, source, heldLabel, extra, subsets }`: see the head of `catalogue.js`. |
| `layers` | `layers.js` | `{ list: [{ id, label, below, relation, start, more, note }], forms, pick(p), shown(id, versions) }`: the layers, top first, and how Read ▾ lists them; see the head of `layers.js`. |
| `paratexts` | `paratexts.js`, `guides.js`, `settings.js` | `{ org, repo, cache, tokenName }`: the private repository of scans and documents, the name of the browser cache, and the name given to members' GitHub tokens (by default "<name> research bench"). | `genres`: [[group, [[id, label, DCMI, CSL, RIS]]]], a bench's own types of item, added to the kit's.
| `examples` | `paratexts.js`, `guides.js` | Placeholders in the paratext forms: `date`, `archive`, `versions`, `refs`, `publisher`, `finding`. |
| `lang` | `genealogy.js`, `compare.js` | The language of the texts: `macro`, `maclisp`, `plain`, or a bench's own (load `kit/lang-<lang>.js` before `kit/genealogy.js`). |
| `comment`, `routine`, `caseFold` | `lang-plain.js`, `functional.js` | For `lang: 'plain'`: the comment mark (a string or a list), a regular expression for a routine's first line (its name in the first group), case meaning nothing. |
| `compare` | `compare.js` | `comment` (the comment mark, for the hover), `normalised` (offer the normalised text), `supplied` ([label, hover] of the supplied-files option), `reading` (the word for building versions). |
| `comparePrefix` | `compare.js` | Before an export's title. |
| `genealogy` | `compare.js` | `set` (the versions first shown), `line` (the line of descent first shown), `lineNames`. |
| `compareDefs` | `compare.js` | Compare's second mode (hooks, below). |
| `stemma` | `stemma.js` | `root` (the first version, lost or not), `lostBetween`, `skip`, `lostOnTrunk`. |
| `edition` | `edition.js` | The reading edition (hooks, below). |
| `findings`, `findingCats`, `findingsTitle`, `findingsSubtitle`, `findingsIntro`, `findingsSide`, `findingsRecheck` | `findings.js` | The bench's own findings (below), their categories, the view's texts (`findingsIntro` is HTML), the side shown first (`crew` or `bench`), the hover of Check again. Conventionally in `js/findings-data.js`, loaded before the kit. |
| `tours`, `tourOffer` | `tours.js` | The guided tours and the offer made on a first visit (below). Conventionally in `js/tour.js`, loaded before the kit. |
| `forks`, `start` | `shell.js` | The version picker's groups (`[[fork, label]]`, by each version's `fork`) and the version shown first. |
| `shell` | `shell.js` | The bench's parts of the frame (hooks, below). |
| `sitemap` | `menus.js`, `sitemap.js` | Where the bench has a `sitemap.html` (Help ▸ Site map): `true`, or how `tools/sitemap.js` writes it: `site` ([href, label], the project's site), `sitePages` ([[href, label]]), `intro` (HTML), `opens` (what a link opens when it names no version), `files` (a sentence on the files), `lost` (the line for a version with no text), `links` ({ pick: href } for a menu item that opens a page of its own). |
| `menus` | `menus.js` | Versions ▾ and Help ▾, and the bench's own menus (hooks, below). |
| `version` | `version.js` | The bench's rows on This version (hooks, below). |
| `refs` | `refs.js` | `repo` (or `SW.BENCH.repo`), `dir` (the sources' folder in it, `source`), `names` (`{ version id: short name }`), `prefix` (before a version's id without one), `supplied` (a pattern for the roles of supplied files), `refOf(vid, p, n0, n1, nparts)` (where the bench writes references otherwise). |
| `refHelp` | `helppages.js`, `menus.js` | Help ▸ Referencing and versions: `example` (a reference in full), `about` (HTML: what each part is), `letters` (`[[letter, witness]]`), `more` (HTML: shorter forms and the rest), `form` (the form in one line, for the list and the export), `versions: { title, hint, all }` (`all`: lost versions too), `ports: { title, head, fold, hint }` (`head`: names for the five columns of `SW.PORTS`). The versions are `SWVersions`, what each text is `SW.MADE`, the ports `SW.PORTS` (`[ref, name, in, where, date, files, [catalogue label, href]]`). |
| `reading` | `helppages.js`, `menus.js` | Help ▸ What you should read: `intro` (HTML), `groups` (`[[heading, [entry HTML]]]`), `menu` (its line in the Help menu). |
| `graphics` | `graphics.js`, `menus.js`, `shell.js` | The Graphics tab's pictures (hooks, below). |
| `lenses` | `lenses.js`, `menus.js`, `shell.js` | The Analyse view's lenses (hooks, below). |
| `cards` | `helppages.js`, `menus.js` | Help ▸ Reconstruction cards (hooks, below). |
| `entry` | `functional.js` | The routine where the program starts. |
| `functional` | `functional.js` | The Functional overview's hooks (below). |

**Findings** (`findings`): `[{ no, kind, cat, level, title, text, ev }]`; `level` is `key`, `notable` or `minor`; each piece of evidence in `ev` is `{ v, re, label }` (a line found by pattern in a version's text, so it survives renumbering) or `{ v, tab, lens, b, tape, label }` (a view). `findingCats`: `[[id, label, regex]]`, a finding's category being the one whose words it has most of, unless a `cat:` tag sets it.

**Tours** (`tours`): `{ welcome: { title, stops: [{ title, text, v, tab, find, b, lens, graphic, gen, tape, focus }] } }`: each stop's version, view, a pattern for the line to select in Read, Compare's other version, a lens, a graphic, a genealogy view, a tape, and a selector to outline.

## Hooks

**The Functional overview** (`SW.BENCH.functional`, every part optional; by default it reads any language by `routine` and calls as a name followed by `(`):

| Hook | What it gives |
|---|---|
| `analyse(b)` | The bench's reading: `{ rs: [{ name, p, n, calls: [{ name, line, named }] }], load: [[{ n, text, count }] per file], show(r) }`. `named`: quoted or passed, for something else to call (marked ‘, not counted as a call). `load`: what each file runs as it is loaded. `show`: which routines are listed (the rest only call). |
| `entry(b)` | The routine where the program starts, where it differs by version (in place of `entry`). |
| `partOf(b, p)` | `{ id, label, short, colour }`: the part of the program a file belongs to (by default each file is one). |
| `defines(b, ps)` | Text: what the files `ps` define (in place of the list of their routines). |
| `label(b, name)` | HTML for a routine's name (a reader's own name for it, a mark). |
| `fileLabel(b, p)` | How a file is named, where several parts of a build share a file name. |
| `word` | What a routine is called (`function`). |
| `startTitle`, `startLede(b, e)` | The first card's title and text. |
| `loadTitle`, `startUpLede` | The start-up card's column for load and its text. |
| `note(b)` | HTML under the start, for what the routines alone do not say. |
| `recorded` | `{ label, title, render(b, el) }`: a view of the program running, for a bench that can run it. The overview then has two modes, the recording first, with a switch; `render` returns a function giving its blocks for export, or null. |

A bench drawing it in a lens calls `SW.functionalOverview.render(b, el, { inline: true })` (the cards go into the lens's grid) and puts `SW.functionalOverview.switchEl(redraw)` in the lens's heading. Examples: the SHRDLU bench's `js/functional.js` (MacLisp, from its index) and the Spacewar! bench's (PDP-1 MACRO, from the assembled words, with the recording of `js/overview.js`).

**The graphics** (`SW.BENCH.graphics`; load `kit/graphics.js` before the bench's own): `list` (`[[id, name, text]]`), `groups` (`[[heading, [id]]]`), `start` and `store` (the graphic first shown, and the key it is kept under), `draw` (`{ id: function (b, el, head) }`: draws the graphic into the page under its heading, returning a function that stops it, or `{ stop, blocks }` for an export), `menuOnly` (`[id]`: items of Graphics ▾ the bench opens elsewhere, through `SW.BENCH.menus.pick`), `noSource(b)` (HTML for a version with nothing to draw).

**The lenses** (`SW.BENCH.lenses`; load `kit/lenses.js` before the bench's `js/analyse.js`): `list` (`[[n, name, text]]`), `menus` (`{ menu: [[heading, [n]]] }`: the lenses in each of the tab row's menus, by its `data-menu`; the menu's button is lit when one of them is open), `picks` (`{ pick: n }`: Versions ▾ items that open a lens), `one` (`{ n: function (b, el) }`: draws lens `n` on a version into the grid `el`, returning a function that gives the export's blocks, or null), `across` (`{ n: function (vs, bs, el, redraw) }`: the lens across the versions, offered as a second mode where given; `acrossLabel` names it), `versions()` and `picker(el, redraw)` (the versions read across, and a control to choose them), `history` (`{ n, title(), file() }`: the lens that follows one name through the versions; the bench's `SW.biography(name)` sets the name and calls `SW.openLens(n)`), `functional` (the number of the lens that is the kit's Functional overview), `anySource` (`[n]`: lenses drawn for a version with no text), `noSource(b)` (HTML in place of a lens that needs a text), `skip` (`[n]`: numbers kept for lenses that have moved elsewhere).

**Reconstruction cards** (`SW.BENCH.cards`, for a bench that repairs its texts to read or run them, after Berry 2025): `about` (the principle, in plain text), `kinds` (`{ key: [class, label, note] }`, or a function giving them: the kinds of repair, shown as chips; `legend`, the keys in the dialog's key), `head` (`[[key, label]]`: the columns, from `id`, `kind`, `where`, `what`, `why`, `evidence`, `by`; by default where, kind, what, evidence, by), `rows(v)` (the repairs to version `v`, or a promise of them: `{ id, kind, kindNote, where, title, what, why, evidence, by, mono }`), `note(v)` (plain text before the table), `after(v)` (`{ title, head, rows }`: a table after it, such as the machine the version runs on), `empty`, `subtitle`, `menu`. A card on This version: `after: function (v) { return SW.cardHTML(v, { about: true }); }` in `SW.BENCH.version`.

**The frame** (`SW.BENCH.shell`): `views` (the views in the order of the tabs; each has a section `#view-<name>` and registers `SW.views[name] = { show(b), hide(), enter(b) }`), `alias` (old view names: `{ sky: 'graphics' }`), `redraw` (views drawn again when the theme changes), `lang(v)` (`{ text, title }` beside the picker), `versionTitle` (the window's title names the version), `onSelect(b)`, `onTheme(t)`, `query(q)` (the bench's own parts of a link: a lens, a graphic; may set `q.tab`), `help` (`{ name: fn }`: the bench's Help items, opened from Help ▾ and by `&help=name`).

**The menus** (`SW.BENCH.menus`): `versions` (`[[pick, label, text]]`), `help` (Help ▾: changes to the kit's list, `{ text: { pick: text }, add: [[where, item]], drop: [pick] }`, where an item `[pick, label, text]` goes after the item picked as `where` or first in the group named `where`, and an item given as a pick alone moves the kit's item there; or the whole list, `[[group, [[pick, label, text]]]]`; `SW.helpList()` gives the list as the bench has it), `menu(which)` (HTML for a menu of the bench's own, its items buttons with `data-pick`), `pick(which, p)` (true where the bench has handled the pick: a lens, a graphic, a Versions item that is not a view), `on(which, p)` (whether a Versions item that is not a view is open). A Help pick opens the Help item of that name; a Versions pick that is a view goes to it.

**This version** (`SW.BENCH.version`): `rows(b)` (`[[label, html]]` after Date, Authors, Descends from, Status and Survives as: by default the files and how they are read), `after(v)` (HTML after the record), `notesHint` (the text above the version's annotations).

**Compare's second mode** (`SW.BENCH.compareDefs`): `{ label, render(el, A, B, h), doc(A, B, r, h) }`; `render` draws the two builds' comparison into `el` and returns `{ crow, mrow, srow }`, `doc` gives the export; `h.vl(b)` names a version. Conventionally `js/compare-defs.js`.

**The reading edition** (`SW.BENCH.edition`): `source(p)` (a note after each source file), `built(b)` (the row saying how the text was read or assembled: `[label, text]`), `layout(raw, pad)` (a line as set on the page), `words` (offer addresses and words), `files` ([label, hover] of the option for support and documentation files).

**A language** (`kit/lang-<name>.js`, registering `root.SWLang[name]`): `normalize(s)`, `parseLine(s)` → `{ labels, code, comment, kind }`, `prepareLine(t, p)`, `stem(src)`, `skipPart(part, opts)`, `routineUnits(text, o, h)`, `sectionUnits(text, o, h)` (`h` gives the genealogy's helpers: `headerStart`, `unitsFromStarts`, `words`, `firstWords`). `lang-plain.js` is the shortest example.

**Read** (`kit/read.js`, loaded after `kit/readnotes.js` and before the bench's `js/read.js`): `SW.readView(H)` takes `hl(raw, b)` (a line highlighted for the bench's language, its names as `<span class="sym" data-s="NAME">`; by default numbers and the comment), `mark(html)` (the highlighted line marked further: control characters, page breaks), `files` (`{ word, info(b), help(info), remember, jump, chips(b, pi), sub(b, pi, t) }`: how the files are named, listed, kept and headed), `errors` (`{ word, title(b) }`: the badge for `b.asm.errors`, opening `SW.asmErrors`), `words(b, L)` and `expand(b, p, n)` (the words a line assembled to, as the Address and Word columns, and what a click on them unfolds), `norm`, `heat` (View ▸ Normalised text and Run heat), `titles` (`{ words, norm, address, word, source }`: their hovers), `rowClass(b, L, k)`, `rowTitle(b, L, k, title)`, `key()`, `symbol(name, b)` (HTML for the pop-up; links with `data-p`/`data-n` go to a line, `data-bio` to `SW.biography`), `selActs()`, `toolbar` (`{ html(b), wire(tb), after(view, b) }`: the bench's own tools at the head of the toolbar, and what goes in it after: a layered bench's ◀ ▶ and breadcrumb), `lost`, `repairs` (`{ nav, view, wire(tb), paint(box, b), click(e, b), bar(), kept(), relayout() }`: the bench's marks on its repairs, with their toolbar, View option and filter), `onShow(b)`. It returns `{ view, opts, R, K, build(), render(), renderListing(), applyFilter(), paintSel(), listingDoc(), selLines(), setWords(on) }`. The template's `js/read.js` is the call alone; SHRDLU's and Spacewar!'s give their languages and their repairs.

**The repairs in Read** (`kit/kintsugi.js`, loaded after `kit/read.js`): `SW.kintsugi(cfg)` takes `stops()` (the repairs to step through, in order: `{ p, n0, n1, chip: { cls, label }, short, name, what, toast, note, id }`), `has()`, `total()`, `paint(box, b, K)` (the bench's marks on the listing just drawn), `click(e, b)`, `extras(cur, ui)` and `act(k, cur, el, on)` (the bar's own buttons, made with `ui.b` and `ui.tg`; `noRedraw`), `others()` and `openOther(id, x, y)` (repairs not in the text, after the stops in the list), `copyLines()`, `about()`, `titles` (`tog`, `next`, `view`, `list(n)`, `listHead(n)`, `others`, `noCurrent`, `keep(ref)`, `copy`), `disableEmpty`. SHRDLU's repairs come from its records, Spacewar!'s from its register of corrected lines; each bench's `js/read.js` has the example.

**Annotations in Read** (`kit/readnotes.js`): `var K = SW.readNotes({ view, R, opts, isMine, showsTape, filtering, keptLines, tapeInfo, kinBar, selActs })` in the bench's `read.js`, then `K.set({ build })` and `K.set({ notes })` as they change; `selActs()` gives buttons of the bench's own for the selection bar (`[[label, fn]]`), `kinBar` the bench's repairs bar.

**Naming, marking and tracings** (`kit/tracings.js`): `SW.tracings({ ns, render, open(t), link(t), hint })` returns the names, marks, pen, tracing tools and their wiring for a view (`ns` prefixes the stored keys).

**Settings rows**: `SW.settings.add({ tab, html, load(), save() })`, before Settings is first opened. **Findings checks**: `SW.findings.addCheck({ title, run(box), doc() })`, run each time the Bench side is shown and exported with it. **Help guides**: `SW.guideAdd(name, [title, sections])`, opened with `SW.guide(name)`.

## Tests

A bench's `tests/annotations.html` loads its values (`window.BENCH_TESTS = { link: { v, l, name }, text, lineKey }`, in its `tests/annotations.test.js`) and the kit's `tests/run.js`, nothing else: the runner reads the bench's `index.html` and loads its scripts in their order, all but `kit/shell.js`, so a script added to the page is in the tests too; then it runs the kit's tests and reports, a script that fails to load among the failures. `tests/annotations.test.js` checks the annotation system's pure parts (Markdown, links, ghosts, open and resolved, mentions); `tests/kit.test.js` checks the version list (on a made-up list, and the bench's own for consistency: ids, descent, chains, lines, files, references), builds (the bench's first version with files, fetched), changes to the Help menu, the beam, octal and a name's pop-up. A new test file goes in `tests/` and in run.js's list; the benches need no change. The template has the page and the values.

## Tools

`tools/release.js` makes a bench's release, run from the bench's repository: the version raised on every script and stylesheet in its pages, a line in its changelog, its README's version, and the kit moved to a release (`--kit v0.31.0`); it stops on conflict markers, pages that disagree, or a kit with changes not in a release, and leaves committing to you. `--check` reports without changing anything, `--dry-run` says what it would do, `--no-changelog` leaves a changelog kept in groups.

```bash
node research/kit/tools/release.js next "What changed." --kit v0.32.0
```

`tools/ocr.swift` and `tools/ocr-vote.js` make a draft transcription from a scan. `ocr.swift` (macOS only, with the Xcode command line tools) reads each page of a PDF with Apple's Vision text recognition and writes its lines with where each begins across the page; `ocr-vote.js`, for a scan that holds many copies of one page (ditto copies, carbons), matches each line of a base page in every copy and takes the reading most copies give, keeping a line's indent. The draft is to be checked against the scan line by line.

```bash
swiftc -O -o /tmp/ocr research/kit/tools/ocr.swift
/tmp/ocr scan.pdf scan.ocr.txt
node research/kit/tools/ocr-vote.js scan.ocr.txt --base 2 --report > draft.txt
```

`tools/kit-release.js` releases the kit itself, run from the kit's repository: the version in `base.js` (`SW.KIT`, which the benches show and `release.js` reports), a dated heading in `CHANGELOG.md` over the notes written under `## Unreleased`, a commit and a tag. `next` raises the last number, `minor` the middle one; pushing stays with you.

```bash
node tools/kit-release.js minor --author "Name <address>"
```

`tools/sitemap.js` writes the bench's `sitemap.html`: every tab, menu item and version as a plain link, each version's source files and scans on GitHub, and the sources, the project's site and the repository for reading without the bench. It opens the bench in headless Chrome and reads it as it runs (the tab row, each menu, the version list, the references), through `sitemap.js`, which benches do not load; it needs Chrome or Chromium (`CHROME=` to name it) and Node 22. Run it after a change to the versions or the menus; `--dry-run` prints the page.

```bash
node research/kit/tools/sitemap.js
```

`tools/styles.js` checks a change to the stylesheets, the bench's or the kit's: in each colour theme and each state of the page (every tab, the Key, every menu open, every menu item, the genealogy's figures) it reads every visible element's computed style with the stylesheets on disk and again with them as committed (`--ref`, HEAD by default; the kit's as that commit pointed to it), and lists the elements that differ, with the properties. Only stylesheets change between the two readings, so nothing else can account for a difference. Use it before releasing a move of CSS between a bench and the kit: it should report that nothing differs. `--themes all` checks every theme (two by default), `--only` named states; it exits 1 when anything differs, and takes a few minutes.

```bash
node research/kit/tools/styles.js --themes all
```

`tools/test.js` runs the bench's test pages (every `tests/*.html`) in headless Chrome and prints each page's count and every failure, with what it got and wanted; it exits 1 when a test fails. GitHub Actions runs it on every push to a bench (`.github/workflows/tests.yml` in the bench: check out with the kit, Node 22, `node research/kit/tools/test.js`), and the kit's own workflow runs it in each bench with the kit as pushed, so a kit change that would break a bench shows before the bench moves to it. A new bench copies the template's workflow; the kit's list of benches (the template, SHRDLU, Spacewar, ELIZA) is in its own `.github/workflows/tests.yml`.

```bash
node research/kit/tools/test.js
```

`tools/chrome.js` is what these tools share: the repository served as GitHub Pages serves it, and the bench in headless Chrome (Node 22 and Chrome or Chromium, `CHROME=` to name it; no packages).

## Licence

GNU General Public License v3.0: see [`LICENSE`](LICENSE).

## Changes

The kit's own changes are in `CHANGELOG.md`. A change is made here first; each bench then takes it by moving its submodule.
