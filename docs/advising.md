# Starting a bench: what to settle first

For a session asked to start a new bench. Settle these with the person who wants it before making the repository; the answers decide the template, the repository's settings and what is built first. `docs/bench-types.md` describes the types; `docs/lessons.md` what earlier benches taught.

## The work

1. **What is the work, and in what versions?** A program in its releases, a text in its witnesses or stages, a translation beside its source. This decides the type (`docs/bench-types.md` §5).
2. **What is a line?** A line of code, of a transcription, a sentence or segment, a paragraph. Every reference, annotation and model will point at it, so it must stay the same as the texts are revised.
3. **Where are the texts, and at what commit?** Each source repository and the commit the bench reads it at. Texts the bench cannot hold (copyright, a library's terms) are named, not copied.
4. **What are the page images, and on what terms?** A library's IIIF manifest (`tools/iiif-map.js`), or the bench's own files. Whether copies may be held in the bench, at what size, with what credit, is for the holder's terms, and for the person the bench belongs to to decide; Melville has the Houghton Library's permission in writing (30 October 2026). A bench that holds copies does not depend on the library's image service, which may refuse many requests at once (`docs/lessons.md`).
5. **What languages and scripts?** For a dictionary (`dictionary.js`, with its `lang`), a word breaker (`SW.BENCH.textLang`, `tokenise`), fonts.

## The repository

6. **Public or private, and under which organisation?** critical-code-studies, vector-humanities, or the project's own. A public bench names no private repository anywhere in it.
7. **Who is in the group?** The Hypothesis group for annotations; for paratexts, a private repository in the organisation, and whether the organisation approves new tokens (`paratexts.approval`).
8. **Does the bench need Genealogy?** It is off unless `genealogy.on` is set. Its readings of descent need tuning for each bench's versions and language, and a bench that turns it on checks what it shows.
9. **What goes in the Library, and what in Paratexts?** Secondary literature in the Library, evidence in Paratexts. In the Library, a work under a CC licence or freely distributable is public; one the group holds otherwise is on the private shelf with a public record; one not held is a record with a link out. `docs/library.md` is the guide.
10. **Licence and citation.** The bench's own licence (the kit is GPL-3.0), `CITATION.cff` with each author's ORCID, a Zenodo record.

## The first release

10. **What should a first reader be able to do?** Usually: read each version, see the page beside the text, annotate, and follow one finding. Build that first and turn the rest off (`menusOff`).
11. **What does the bench establish?** Its findings, each with evidence in the lines, and a tour of five stops or so.
12. **Who keeps it?** A session on the bench (its `WORKING.md`), and the bench-kit session for anything that belongs in the kit.

## Then

- Make the repository from the template (`templates/README.md`), add the kit as a submodule at the pinned release, and fill `js/config.js` and `js/versions.js`.
- Add the bench to the kit's CI matrix (`.github/workflows/tests.yml`) once its tests pass.
- Record the answers above in the bench's README and its `WORKING.md`.
