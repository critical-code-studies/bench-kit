# Changelog: bench-kit

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
