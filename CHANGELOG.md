# Changelog: bench-kit

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
