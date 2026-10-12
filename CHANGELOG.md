# Changelog: bench-kit

## 0.37.0 (2026-10-12)

- `lang-mad.js` reads FAP decks (a label, the operation, its address, a comment; * for a comment card), decks headed by a sequence number, and remark and continuation marks in column 11, 12 or 13; the genealogy reads a FAP deck's lines as FAP. For SLIP, under ELIZA.
- `read.js`: `toolbar: { html(b), wire(tb), after(view, b) }`, a bench's own tools at the head of Read's toolbar (the ELIZA bench's layers: ◀ ▶ and the breadcrumb).

## 0.36.0 (2026-10-12)

- `lang-mad.js`: MAD-SLIP and the ELIZA scripts, for the ELIZA bench: cards (label, remark, continuation, sequence number), decks, MAD's keywords whole and short, text, relations and calls; a script's lists, comments, references and classes. Routines are decks, internal functions and a script's keyword entries; sections are files.

## 0.35.1 (2026-10-12)

- `tools/chrome.js`: up to a minute for Chrome to start (a fresh GitHub machine took longer than the 15 seconds allowed), and when it does not, Chrome's own last words.

## 0.35.0 (2026-10-12)

- `tools/test.js`: a bench's test pages run in headless Chrome, with each page's count and every failure printed; exits 1 on a failure. For GitHub Actions and for use by hand.
- `.github/workflows/tests.yml`: on every push to the kit, its tests run in the template, SHRDLU and Spacewar with the kit as pushed.
- `tools/chrome.js`: `ready` (when the page is done) and `wait`; on a CI machine Chrome runs without its sandbox.

## 0.34.1 (2026-10-12)

- `paratexts.js`: PDFs are opened with `isEvalSupported: false`. PDF.js 3.11.174 can be made to run a crafted PDF's script through its font handling (CVE-2024-4367, fixed in PDF.js 4.2.67), in the page that holds the reader's Hypothesis and GitHub tokens; this turns that path off without changing how PDFs are drawn. Moving to PDF.js 4.10.38 (ES modules) is left for a later release.

## 0.34.0 (2026-10-12)

- `tests/run.js` loads the bench's scripts from its `index.html` (all but `kit/shell.js`) and draws the page's heading, summary and list; a bench's `tests/annotations.html` is now its values and the runner, and its script list no longer repeats the page's. A script that fails to load is reported by name.

## 0.33.0 (2026-10-12)

- `tools/styles.js` and `tools/styles-page.js`: a change to the stylesheets checked against the last commit (or `--ref`), element by element, in every state of the page and each colour theme asked for (`--themes all`); the kit's stylesheets as the bench's commit pointed to them. A state read twice with the stylesheets on disk sets aside what changes by itself (an animation). Exits 1 when anything differs.
- `tools/chrome.js`: the server and headless Chrome the tools share; `tools/sitemap.js` uses it.

## 0.32.0 (2026-10-12)

- `tools/sitemap.js` and `sitemap.js`: a bench's `sitemap.html`, made from the bench as it runs in headless Chrome: the tab row, each menu with its headings (lenses, graphics, Versions, Help), every version with its reference, Read, Run and Record, its files and scans on GitHub, and a closing list for reading without the bench. Settings in `SW.BENCH.sitemap` (`site`, `sitePages`, `intro`, `opens`, `files`, `lost`, `links`). No packages: Node 22 and Chrome.
- `tools/release.js`: the closing hint names the files it changed (`git add …`), the kit and a README outside the bench's folder among them.

## 0.31.1 (2026-10-12)

- `tools/release.js`: tags are fetched with `--force`, so a tag moved in the kit's repository (as v0.25.0 was) is taken rather than stopping the release; git's own message is shown when a git step fails.

## 0.31.0 (2026-10-12)

- `tests/run.js` runs the kit's tests in a bench's tests page (`T.group`, `T.eq`, `T.yes`, `T.later` for checks that fetch), loading the kit modules they need; a bench's `tests/annotations.html` loads it in place of `tests/annotations.test.js`.
- `tests/kit.test.js`: 37 checks of the version list, the bench's own versions and references, builds, Help menu changes, the beam, octal and a name's pop-up.
- `tools/release.js`: a bench's release in one command (`next "What changed." --kit <tag>`), with `--check`, `--dry-run` and `--no-changelog`.
- `menus.js`: `SW.helpList()`, the Help menu as the bench has it.

## 0.30.0 (2026-10-12)

- `tests/annotations.test.js`: the annotation tests the benches each held, with the bench's values (a link, a non-ASCII phrase, a line and its key) in its own `tests/annotations.test.js` as `window.BENCH_TESTS`, and its old tag prefix from `SW.BENCH.tag`.
- `base.js` makes the side panel, the annotate dialog and the toast after the page's `<main>`, where every bench had the same markup; the tags' example is `SW.BENCH.tagsHint`.
- `bench.css`: the KWIC lens, the Key's text colours, page-break marks, small bars (`.ov-bar`), the repairs bar and chips and the repair flash, the shading of annotated lines, and the small-screen rules, from the benches' stylesheets.
- `figures.js`: `SW.beam(s)`, from the benches' `core.js`.

## 0.29.0 (2026-10-12)

- `versionlist.js`: a bench's list of versions from its records, in the browser and Node: links, descent (`parent`, `witness`, `also`, `influence`), `byId`, `ancestry`, the lines of descent, and a default `load` (each file as held; documentation not indexed as code), from each bench's `js/versions.js`, which now keeps its records and calls `SWVersionList({ … })`. Load it before the bench's `js/versions.js`.
- `read.js`: `SW.symbolRefs(b, s, o)`, the list in a name's pop-up of where it is defined and used (`o.file`, `o.width`).

## 0.28.0 (2026-10-12)

- The tab row: a menu's button is lit by the lenses `SW.BENCH.lenses.menus` puts in it; the buttons' `data-lenses` attribute, which repeated that list, is no longer read.
- Help ▾: `SW.BENCH.menus.help` may give changes to the kit's list (`text`, `add`, `drop`) in place of the whole list, which still works. Site map is in the kit's list where `SW.BENCH.sitemap` is set.

## 0.27.0 (2026-10-12)

- The gold of repairs has one name, `--kin` (with `--kin-bg`), where the benches had `--gold` (SHRDLU, the template) or `--kin` (Spacewar) and the kit read both. A bench that set `--gold` sets `--kin`. In a bench that had only `--gold`, the chosen rating in Findings is now drawn in gold (it read `--kin`, which was unset).

## 0.26.0 (2026-10-12)

- `themes.css`: the six colour themes (paper, white, sepia, green, amber, contrast), the type (`--mono`, `--sans`, `--serif`, `--code-font`, `--code-size`), the menus' panel, gold (`--gold`, `--gold-bg`), the annotation marks (`--anno-line`, `--anno-block`) and the genealogy figures' colour schemes (`data-gpal`), from the benches' own `css/research.css`. The accent in each theme is the template's; a bench changes any token of a theme by repeating its selector. Load it after `kit/bench.css`, before the bench's `css/research.css`, which keeps its default colours on `:root`.

## 0.25.0 (2026-10-12)

- `builds.js`: fetching (`SW.fetchText`, `SW.fetchBytes`), the cache of builds (`SW.build(id, extra)`, `SW.current()`), opening a version at a line (`SW.openAt`), an export's details (`SW.docMeta`) and `SW.oct`, from the benches' own `core.js`. The bench says how a version is read: `SW.builds({ read(v, L, extra), split, key(v, extra), meta(b) })`. Load it after `kit/refs.js`, before the bench's `js/core.js`.

## 0.24.4 (2026-10-12)

- `bench.css`: the rules for what the kit draws under names it builds as it runs, which the benches still carried: Read's kinds of line and their swatches in the Key, My notes' sync states, Findings' levels, and the site-map link in the tab row.

## 0.24.3 (2026-10-12)

- Paratexts: a drag over a picture or a PDF page no longer selects the words the system finds in it (Live Text, the blue boxes): a transparent cover over the picture takes the pointer.

## 0.24.2 (2026-10-12)

- Paratexts, a picture or a PDF page, alone or side by side: zooming and dragging are smooth (the picture laid out once at its fitted size, then moved and zoomed by a transform, at most once a frame), and a drag no longer selects (the blue box).

## 0.24.1 (2026-10-12)

- Paratexts side by side: a PDF is drawn a page at a time too (PDF.js), so that it zooms and moves as a picture does, with the other pane when Together is on; ‹ › in each PDF's heading for its pages, and Page Up and Down for every PDF shown, each kept at the same zoom and place on the page.

## 0.24.0 (2026-10-12)

- Paratexts: a PDF is drawn a page at a time by Mozilla's PDF.js (3.11.174, fetched from cdnjs the first time a PDF is opened), in the box a picture is shown in: drag to move, the wheel or a pinch to zoom where the pointer is, a double-click to zoom in, Fit, 1:1 (the page at its own size), ‹ › or Page Up and Down for the pages, and Open ↗ for the browser's own viewer. In place of 0.23.1's wider frame, which could not be moved across.

## 0.23.1 (2026-10-12)

- Paratexts: zooming a PDF (− ＋) makes its frame wider or narrower than the box, the page fitted to the frame's width and the box scrolling across, in place of the viewer's own `#zoom=`, which the browser's PDF viewer no longer honoured. Fit page and Fit width are as before.

## 0.23.0 (2026-10-12)

- `kintsugi.js`: the repairs in Read, from the benches' own copies: the ◆ ‹ › stepper, the repairs bar and its list, Only the repaired lines, My notes, Copy, the cards, View ▸ Repairs (gold), the squiggle and its measuring. The bench gives its repairs as stops, its marks, and its own buttons on the bar (`SW.kintsugi(cfg)`, given to `SW.readView` as `repairs`).
- `read.js`: Read hands its own parts to the repairs (`repairs.init(ctx)`).
- `bench.css`: the stepper, the bar, the list and the squiggle.

## 0.22.2 (2026-10-12)

- `lenses.js`: a version counts as having no text when none is held, not when nothing has assembled it, so that a bench reading plain text (the template) draws its lenses.

## 0.22.1 (2026-10-12)

- A drop-down menu too wide to open either way on a narrow window (the Graphics menus) is moved left only as far as it needs, and no further than the window's left edge.

## 0.22.0 (2026-10-12)

- `graphics.js`: the Graphics tab's frame, from the benches' own copies: the heading with its menu, Graphics ▾ in the tab row (in groups, two columns), `&g=` in a link, opening a graphic from the tour, stopping an animation when another is chosen, the export. The pictures stay the bench's (`SW.BENCH.graphics`).
- `bench.css`: the Graphics menus in groups.

## 0.21.0 (2026-10-12)

- `read.js`: the Read view, from the benches' own copies (the template's, with what SHRDLU's and Spacewar!'s added): the listing, the toolbar (search, View, filters, ↶ ↷, the file picker, the error badge, the reading edition, Export, the notes modes), the Key, the pop-up on a name, the side panel of a line's annotations, the filter, the file headings and the column headings, the Address and Word columns with their expansions, Normalised text and Run heat, breakpoints and other selection actions, refreshing notes when Read is next opened. The bench gives its language, its files' names and its marks on its repairs (`SW.readView(H)`).
- `bench.css`: Read's breakpoints, the Key's list and the folding of the Address and Word columns.

## 0.20.0 (2026-10-12)

- `lenses.js`: the Analyse view, from the benches' own copies. The heading (the lens menu, This version or across the versions, the description and the reference), the export menu, the lens menus in the tab row and the Versions items that open a lens, `&lens=` in a link, the Functional overview and a name's history as lenses; the lenses themselves stay the bench's (`SW.BENCH.lenses`).
- `bench.css`: the Analyse view's heading and the lens menus.

## 0.19.0 (2026-10-12)

- `helppages.js`: Help ▸ Referencing and versions, What you should read and Reconstruction cards, from the benches' own copies, drawn from the bench's data (`SW.BENCH.refHelp`, `reading`, `cards`). The versions table links each text on GitHub and gives its SWHIDs wherever the bench has them; a card can be copied, exported as Word, Markdown, PNG or SVG, or kept in My notes as text or as a figure, on every bench. The Help menu and links (`&help=refs`, `reading`, `cards`) open them.
- `bench.css`: their styles, a card in the bench's `--kin` (or `--gold`).

## 0.18.0 (2026-10-11)

- `bench.css`: the styles every bench shares (the frame and the kit's views), 733 rules from the benches' own `css/research.css`, loaded before it. A bench's stylesheet keeps its colours (`:root` and the themes) and its own parts. Each bench was checked view by view, in a dark and a light theme and at phone width, for any change in the computed styles of what is shown.

## 0.17.3 (2026-10-11)

- Genealogy's Flow with the code shown: the boxes and code in their columns again (0.17.2 put them nowhere).

## 0.17.2 (2026-10-11)

- Genealogy's Flow, zoomed in far enough to show the code: the code text is drawn only for the part of the chart on screen and a screen either side, and scrolling redraws only that text (the ribbons and boxes stay). At full zoom on a long program the chart had tens of thousands of lines of text, which made the page slow, the About box over it included.

## 0.17.1 (2026-10-11)

- The About box's Tech stack row, shorter.

## 0.17.0 (2026-10-11)

- The bench's frame, from the benches' own copies: `shell.js` (start-up, the version picker, the tabs and views, the theme, the top bar, links; the bench's parts from `SW.BENCH.shell`), `menus.js` (the tab row's menus: Versions and Help, and the bench's lenses and graphics through `SW.BENCH.menus`), `version.js` (Versions ▸ This version; the bench's rows from `SW.BENCH.version`) and `refs.js` (references, citations, the files on GitHub and their SWHIDs; from `SW.BENCH.refs`). `SW.help(name)` opens a Help item, from the menu or a link.
- The code box names paratexts (P-) among the codes it goes to.

## 0.16.2 (2026-10-11)

- The About box's Bench kit row in one line: the kit's version, what it is, and its link.
- The README names its author and the kit's version under its title (raise the version there with each release, as in `base.js`).

## 0.16.1 (2026-10-11)

- The README lists everything a bench provides (versions, builds, the functions the kit calls, state, the page's elements), every setting in `SW.BENCH` with the module that reads it, and every hook (the Functional overview's, Compare's second mode, the reading edition, a language adapter, annotations in Read, tracings, Settings rows, findings checks, Help guides).

## 0.16.0 (2026-10-11)

- `functional.js` has two modes where a bench can run its program: the bench's recorded view (`SW.BENCH.functional.recorded`) and the reading of the source, with a switch (Recorded run, Read from the source) in the view's heading, or in a lens's (`SW.functionalOverview.switchEl`); the choice kept in this browser (`fo.mode`). Without a recorded view there is only the reading, and no switch. From the Spacewar! bench, whose recording is the first.

## 0.15.0 (2026-10-11)

- `functional.js`: the routine where the program starts can come from the bench (`entry(b)`, for one that differs by version), a file can be named by the bench (`fileLabel(b, p)`, where several tapes of a build share a file name), and the start-up card's column and text can say what a file assembles to (`loadTitle`, `startUpLede`). For the Spacewar! bench's Functional overview, Read from the source.

## 0.14.0 (2026-10-11)

- `functional.js` takes a bench's own reading in full (`SW.BENCH.functional`): the routines and their calls and names, what loading a file runs (`load`), which routines to list (`show`), the files grouped into parts (`partOf`, with a short name and a colour), what each part defines (`defines`), a routine's label (`label`), the word for a routine (`word`), the start's title and text (`startTitle`, `startLede`), and a note. Calls between parts count calls, not names. `inline` draws the cards straight into a lens's grid. The SHRDLU bench's Functional overview is drawn by it.
- The start's text no longer names the setting (`SW.BENCH.entry`).

## 0.13.0 (2026-10-11)

- `functional.js`, from bench-template: a Functional overview read from the source (where the program starts, what each file runs as it loads, the files' routines and entry points, the calls between the files). For any language by default; a bench's own reading of routines and calls with `SW.BENCH.functional.analyse(b)`, with names quoted or passed for something else to call marked (‘), and a note with `note(b)`. Its styles in `kit.css`.

## 0.12.0 (2026-10-11)

- `lang-plain.js`: a language adapter for any source text, set by the bench (`comment`, `routine`, `caseFold`), for Compare and Genealogy. The adapter of [bench-template](https://github.com/critical-code-studies/bench-template), the starting point for a new bench.

## 0.11.0 (2026-10-11)

- `about.js`: the About box, shared. The rows every bench has (author, version, release date, tech stack, the kit, catalogue, citation, the welcome tour) are the kit's; the bench's own (icon, purpose, what is inside, sources, code, how its catalogue counts) come from `SW.BENCH.about`. The box is made when opened (`SW.about.open()`), so it is no longer in the bench's `index.html`. Its styles are in `kit.css`. The Bench kit row of 0.9.1 is part of it.

## 0.10.0 (2026-10-11)

- `readnotes.js`, from the two benches' `read.js` (the 630 lines they had in common): Read's annotation layer, made by `SW.readNotes(X)` with the bench's view, options and its own parts (`isMine`, `showsTape`, `filtering`, `keptLines`, `tapeInfo`, `kinBar`, and `selActs` for buttons of its own on the selection bar, such as Spacewar!'s Breakpoint and Run to here). Load it before the bench's `js/read.js`.
- For the SHRDLU bench, from Spacewar!: a note added, edited or binned makes the next refresh look for ghosts again.

## 0.9.1 (2026-10-11)

- A Bench kit row in the bench's About box (after Tech stack): the kit's version (`SW.KIT.version`), what it holds and a link to it.

## 0.9.0 (2026-10-11)

- The helpers both benches' `core.js` had in common, now here: `base.js` (the `SW` object and its helpers, storage, events, toasts, side panel, popovers, tables, sharing, the query, Developer mode, ghost matching, earlier wordings, figures in annotations), `md.js` (Markdown and the note editor) and `themes.js` (code text, hands, colour schemes and themes, figure and document export). `base.js` loads first, then the bench's `config.js`, `md.js` and `themes.js`, then the bench's `core.js`.
- From `SW.BENCH`: the storage prefix (`store`), the default theme's name (`theme`), the accent of exported figures (`accent`), the hands (`hands`), the file name of exports (`slug`).
- An annotation's hidden marks are written `bk:` (`bk:was`, `bk:fig:gz`) and read under the bench's old prefix as well (`SW.markRE`). Findings shared from the SHRDLU bench carried their figure as `sw:fig:gz`, which that bench did not read; now `bk:fig:gz`, read on both.

## 0.8.1 (2026-10-11)

- Art's Dynamic Profile Gizmo is called Dynamic Profile: a tracing made there names it so.

## 0.8.0 (2026-10-11)

- `tracings.js`: naming, marking and tracings, from the Spacewar! bench's gizmo, for any view: the stored keys under the view's prefix, the drawing, opening and link the bench's. Its styles in `kit.css`.
- A tracing names where it was made (`where`, shown in its text in the group), no longer always the gizmo.

## 0.7.0 (2026-10-11)

- `compare.js` and `genealogy.js`, from the Spacewar! bench 1.18.44, with the text's language in adapters: `lang-macro.js` (PDP-1 MACRO, from Spacewar!) and `lang-maclisp.js` (MacLisp, from SHRDLU), named by `SW.BENCH.lang`. Checked: for every version of both benches, with and without supplied files, the adapters give the same lines, routines and sections as the benches' own genealogy did.
- Compare's second mode is the bench's (`SW.BENCH.compareDefs`); its options, defaults and names come from `SW.BENCH`.
- For the SHRDLU bench, from Spacewar!: the genealogy flow's ribbons drawn from the lines themselves (forks and joins where code was re-cut), with a Detail control.

## 0.6.0 (2026-10-11)

- `findings.js`, from the Spacewar! bench 1.18.43: the list, categories and texts from `SW.BENCH`; the bench's checks added with `SW.findings.addCheck({ title, run, doc })`, each giving its own section to the export. For the SHRDLU bench, from Spacewar!: replies shown at once, the list behind brought up to date when the finding's window closes, Category opening on All, tags in words. From SHRDLU, for both: evidence that opens a lens, a tall finding shown from its start.

## 0.5.0 (2026-10-11)

- One prefix for every bench's tags in Hypothesis, `bk:` (`bk:v:`, `bk:by:`, `bk:lines:` …). Annotations written before keep their bench's prefix (`sw:`, `sh:`), since only an author can change an annotation, and are read alongside: `SW.BENCH.tag` names the old prefix. Searches by tag (the bin, tracings) look under both.

## 0.4.0 (2026-10-11)

- `notes.js`, from the Spacewar! bench 1.18.42, reading the bench's tag prefix, name, default group, invitation card and Help examples from `SW.BENCH`. The SHRDLU bench gains Spacewar!'s: copies kept from ghosts tracked by their original (`from`), so a ghost returns when its copy is deleted; tracings shared through the group; the bench's own marks (level:, note:, cat:, chapter:) kept out of the edit box and kept on saving, and shown in words (`SW.tagLabel`, defined here when the bench has none).
- Where initials are missing, the annotation and reply boxes offer the initials box (`data-ask-initials`).

## 0.3.1 (2026-10-11)

- Settings: the tour button sits at the foot beside Cancel and Save (its note in its hover), so the tabs keep one row in a narrow window.

## 0.3.0 (2026-10-11)

- `initials.js`: one initials box for every bench, from the two benches' own: two to four letters, capitals as you type, Not now (remembered as `ini.later`), and Save, Not now and Esc finishing it at once rather than on its close event. `SW.withInitials`; any `[data-ask-initials]` button opens it.
- `settings.js`: ⚙ Settings made by the kit, in tabs (You, Annotations, Paratexts, Display, Developer), opening on the tab last used; the bench's own rows by `SW.settings.add`. Initials in Settings follow the same rule. Test connection sits with the Annotations it tests.
- `kit.css` for both.
- The Paratexts tab's Open ⚙ Settings goes to the Paratexts tab; the tour no longer assumes the Settings box exists.

## 0.2.0 (2026-10-11)

- `export.js`, `tray.js`, `figures.js`, `stemma.js`, `edition.js` and `tours.js`, from the Spacewar! bench 1.18.40, made to read the bench's names, storage prefix, default group, figure colour, stemma, edition hooks and tour stops from `SW.BENCH`.
- From Spacewar!, for both benches: PNG export within Safari's canvas limit with fallbacks (figures), the initials box when adding to My notes (tray).
- The edition's option for supplied or support files is labelled by the bench (it read "all files tapes" on SHRDLU).

## 0.1.1 (2026-10-11)

- `paratexts.css` takes the last two paratext rules (`.px .lede`, `.pxlink`) from the benches.

## 0.1.0 (2026-10-11)

- `paratexts.js`, `guides.js` and `paratexts.css`, from the Spacewar! bench 1.18.39 (where Paratexts began, 1.18.13) with zoom from the SHRDLU bench (0.1.71), made to read the bench's settings (`SW.BENCH`) in place of its names.
- `SW.guideAdd` for a bench's own guides; the Spacewar! bench's guide to Art's Dynamic Profile Gizmo moves to that bench.
