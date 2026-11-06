# Bench types: a guide

A research bench is a repository of its own, made from a template in `templates/` and built on bench-kit, which it holds as a git submodule. This guide sets out the kinds of bench made so far, which of the kit's modules each uses, and what the bench supplies itself. `docs/advising.md` gives the questions to settle before starting one; `docs/lessons.md` gives what the existing benches have taught.

## 1. What every bench has

Every bench reads **versions**: a version is a set of files, a file is a set of lines, and the line is the unit every view refers to. A reference (`[REF: …]`), an annotation's anchor, a collation, a span in Book and a topic document's place all point at a file and a line. What a line is differs by bench: a line of code, a line of a transcription, a sentence or segment of a translation.

From the kit, whatever the type:

| Part | Modules |
|---|---|
| The frame | `base.js`, `shell.js`, `menus.js` (`menusOff` turns parts off), `settings.js`, `themes.js`, `about.js`, `sitemap.js`, `tours.js`, `guides.js`, `helppages.js` |
| The texts | `versionlist.js`, `builds.js` (fetching and building), `refs.js` (references), `read.js` and `readnotes.js` (Read) |
| The group | `notes.js` (Hypothesis annotation), `paratexts.js` (the private collection, with a token), `initials.js` |
| Research | `findings.js`, `tray.js` (My notes), `export.js` (Word and Markdown), `figures.js` |

From the bench, whatever the type: `js/versions.js` (its versions and their files), `js/config.js` (`SW.BENCH`), `js/core.js` (how its files become lines, and what each line is), `js/main.js` (its views, in tab order), and its tests.

## 2. A code bench

For a program and its versions: Spacewar!, SHRDLU, ELIZA, CCSbench. Made from `bench-template`.

- **Line**: a line of source. **Version**: a release, a tape, a listing, a port.
- **Kit modules**: the language readers (`lang-*.js`, `genealogy.js`, `lispdefs.js`), `compare.js` (Collate), `stemma.js`, `functional.js` (where the program starts and what it calls), `tracings.js`, `graphics.js`, `layers.js` (code that runs on code), `implementations.js`, `kintsugi.js` and `mending.js` (repairs to a version so that it reads or runs), `builder.js` and `projectfile.js` (versions made from files in the page), `catalogue.js` (what is known to have existed).
- **The bench supplies**: its language's reader (labels, comments, routines), its versions' descent, its findings.

## 3. A prose bench

For a literary or historical text in its witnesses: Melville (*Billy Budd*). Made from `bench-template` with Book turned on (no prose template yet).

- **Line**: a line of the transcription, as the encoding has it. **Version**: a witness, a stage of a manuscript, an edition.
- **Kit modules**: `book.js` (the text set as pages, the page image beside each, revision stages, Compare), `compare.js` with `lang-plain.js`, `edition.js`, `textstats.js`, `wordcloud.js`, `lenses.js`, `topics.js` and `mallette.js`, `dictionary.js`, `library.js`.
- **The bench supplies**: a reader that makes Book's document (`b.doc`: blocks and spans, each span keyed to its line, page breaks with an image or IIIF service; Melville's `js/tei.js` reads TEI), its documents for Topics (`docs/topics-guide.md`), its lenses, its page images (`tools/iiif-map.js`).

## 4. A translation bench

For a translation made by the vector translation method, read beside its source: Kuki's *The Problem of Contingency* is the first. Made from `templates/translation/`.

- **Line**: a line of the translation's Markdown file, which is a paragraph or a note. **Version**: the translation, the literal translation, the source's OCR.
- **Kit modules**: as a prose bench, and `vt-reader.js` (the method's layout: page and image markers, sections, notes, the glossary, change lists, OCR), Book with the image to the left of the translation, and the literal beside it on a switch (image | translation | literal), `folder.js` (a translator's working copy, read without a token), `dictionary.js` in the source's language, `textstats.js` with the word breaker for unspaced scripts, `library.js` (the corpus), `tools/iiif-map.js` (pages cut from the library's spreads), `images.js` and `tools/vt-figures.js` (the figures and their labels, from the translation's `figures.csv`).
- **The bench supplies**: its descriptor (`SW.BENCH.translation`: where its files are, its markers), a snapshot of its texts at a commit, its image map, its findings and tour.

## 5. Choosing

| The work is… | Type |
|---|---|
| a program, in versions | code |
| a text in its witnesses or stages, transcribed or encoded | prose |
| a translation with its source, glossary and change history | translation |

A bench that does not fit takes the nearest type and turns off what it does not use (`menusOff`), and the new type is written up here once a second bench of its kind is made.
