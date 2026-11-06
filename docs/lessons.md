# Lessons from the benches

What making and keeping the Spacewar!, SHRDLU, ELIZA, Melville and CCSbench benches has taught, for whoever makes the next one. Each lesson names where it was learnt.

## Texts and references

- **The line is the unit, and ids must not move.** Annotations, references, findings and topic models point at a file and a line, or at a document's id. Every build must give the same ids for the same text: build them from the unit and its number (`rt-c12-2`), never from a place in a list that can shift. (Melville's topic documents; every bench's annotations.)
- **Pin each source at a commit.** A version's files come from a repository at a commit, recorded in `js/versions.js`, so that a line number means the same line for every reader. When the commit moves, the Topics tab warns on models made before. (Melville, MEL's TEI.)
- **Keep apparatus out of what is counted.** Editors' notes, line numbers, running heads, shelfmarks and an author's own dates on a manuscript are not the work's text; left in, they become a topic of their own (*leaf*, *text*, *line*). (Melville's first topic model.)

## The kit and the bench

- **Edit the kit, never a bench's copy of it.** A change goes to bench-kit on a proposal branch, is released on David's word, and each bench moves its submodule (`release.js --kit vX`). A change made in a bench's `kit/` is lost at its next move. (The rule since Spacewar and SHRDLU began to share code.)
- **Supply data and hooks, do not fork a view.** A bench gives `SW.BENCH` settings, a reader that makes `b.doc`, `documents()` for Topics, lens cards; the kit draws. When a bench needs a view the kit lacks, the view goes into the kit for every bench. (Read, Book and Topics were each lifted from one bench.)
- **Turn off what is not ready.** `menusOff` leaves a tab or an item out while it is being made. (Melville's Topics tab, before its first model.)
- **A kit test must not assume one bench's settings.** The kit's tests run in every bench, and the kit's CI runs every bench. A check that the Help menu's Annotating group could be emptied failed on Spacewar from 0.93.0 to 0.97.1, because Spacewar adds its own items there. (bench-kit 0.97.1.)

## Releasing

- **Before a release**: the bench's own tests and the kit's (`tools/test.js`), every view (`tools/views.js`), `release.js --check`, and the site map made again. (Every release since 0.80.)
- **The browser keeps old scripts.** Scripts load with `?v=`, and a page that seems to run old code is usually being served an old copy; fetch the script again before looking for a bug. (Every bench.)
- **Zenodo archives a release only when `CITATION.cff` is valid**, an author's ORCID included; a bad ORCID fails without a message. (bench-kit, mallette.)

## Public and private

- **No private URLs or repository names in public repositories**, READMEs and examples included. The mallette README once named the benches' private repositories, and the repository had to be deleted and made again. (mallette, 2026-11.)
- **Public and private collections are kept apart.** The Library is public and held in the bench's own repository; Paratexts is the group's, private, read with each member's token. A Library entry's private copy is found from the private side (the paratext names the entry), so the public list says nothing of it. (Melville, 2026-11-05.)

## The group

- **Joining has two steps for each service, in order**: join the Hypothesis group, then give the bench a token; accept the GitHub invitation, then make a token, with the resource owner set to the organisation, only the paratexts repository chosen, and Contents read and write. Newcomers found it hard to follow when the steps were given together. (Spacewar, bench-kit 0.97.0.)
- **Tokens are lost.** Safari clears a site's stored data after seven days without a visit; a token kept in the browser goes with it. The guide says how to make a new one. (Spacewar.)

## Images and languages

- **A library's image service is not a CDN.** It may answer a bench's readers with 429 when many images are asked for at once, and pages then break for everyone. Where the rights allow, hold copies in the bench (`images.held`, `doc.image`) and ask the library for nothing. Where they do not, ask through a queue, a few at a time, backing off on failure. (Kuki, the National Diet Library, 2026-11-06.)
- **Ask a IIIF service only what its level answers.** A level 1 service (the National Diet Library's) takes a region in pixels and a size by width or height, not a region in per cent or a size to fit a box. (`tools/iiif-map.js`, 2026-11-05.)
- **Unspaced scripts need a word breaker.** Japanese read as runs of letters gives one "word" to a clause; the kit uses the browser's `Intl.Segmenter`, or the bench's own tokeniser. Dictionary lookup in such a script tries the longest word a selection begins with. (The translation bench, 2026-11-05.)
- **OCR of a pre-war source is weak on exactly the terms that matter.** On Kuki's NDL scans the OCR never reads 邂逅, and a fuzzy match of three characters takes 必然性 for 偶然性; search the translation's own source text where it has one. (The translation bench, 2026-11-05.)
