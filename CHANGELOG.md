# Changelog: bench-kit

## Unreleased

- Book (asked for by David):
  - **Zoom** in the enlarged page: the wheel and a pinch, + and −, a drag to move about, 0 or ⟲ for the whole page; the revisions' boxes zoom with the image. A click on the zoomed image no longer closes the view; a click beside it does.
  - **🔗 Share**, in the toolbar and in the enlarged page's details: a link that opens Book exactly there, with the same version, stage, Strike deletions, Compare and image settings, the place, the box clicked (held again for whoever opens it), and, from the enlarged page, that page open at the same zoom and centre (`pz`, `zm`, `hz`).
  - **A page transcribed elsewhere** (`pb.elsewhere: [{ to, note }]`, from the document): a link by the page's rule to the page its text is transcribed under, with the note, and, where the page has boxes, the part of its image below its lowest box leading there; its text is highlighted as a box's is. On the Melville bench, the slip pasted on img_7 leads to its text under img_9.

## 0.79.0 (2026-10-25)

- Book, the revisions' boxes (asked for by David): a click on a box, beside the text or in the enlarged view, highlights the text written there and keeps it highlighted until the reader clicks again, scrolls the text, hovers another revision or moves the slider (it flashed once); where that text is not in the text at the stage, a note says so. The boxes' title is "Highlight this in panel". In the enlarged view a box under the pointer shows, by it, the words written there (a deletion struck), what the revision is, with what it replaced or what replaced it, and its stage and hand; a click closes the view with its text highlighted.

## 0.78.0 (2026-10-22)

- Book (asked for by David): **the enlarged page has the revisions' boxes** as beside the text, faint with the pointer on the image, the stage's lit in red, a click on one closing the view at the text written there; laid over the picture as drawn, through ◀ ▶ and resizing. **With Compare**, a passage of a text facing a version's states lights its page in the other column, and the boxes of the revisions whose words are mostly (three fifths or more) in that passage; where none matches so closely, the page alone (on the Melville bench, hovering "Scotch Highland" in the reading text lights leaf img_11 and the box of "Highland").

## 0.77.0 (2026-10-22)

- Book: **the text and the page's image joined** (asked for by David), where the document gives the boxes its revisions are written in (`doc.zones`, each page break's `size`, a revision mark's `zone`). A revision under the pointer, or tapped, lights its box on the page beside it; the boxes show faintly while the pointer is on the image, and a click on one goes to the text written there (to its passage, with a note, where that text is taken out at the stage); the slider lights the boxes of the revisions made at its stage, so the hand is seen moving across the page. A box's corners may come either way round; a zone the document does not define is passed over. Built with the Melville bench's MEL zones (8,321 boxes).

## 0.76.0 (2026-10-22)

- Book: **Strike deletions**, beside the stage slider (asked for by David). The deletions made up to the stage stay in the text, struck through in red, or in the hand's colour with hands on, each drawn through as the slider reaches it; a reinstated word is plain again at its stage; the revisions made at the stage itself are marked more strongly; additions as before. Kept for the browser, and in the address as `del=strike`. Four checks in tests/book.test.js.

## 0.75.0 (2026-10-22)

- Book: a page's image can come from the bench's own files, `SW.BENCH.doc.image(pb)` giving its URL, or `{ src, large }` (large for the enlarged view), in place of the IIIF service, so that a bench can serve its images itself (asked for by David, for the Melville bench's leaves). A page with neither shows none.

## 0.74.3 (2026-10-21)

- Versions ▾: Collate's line names By function only where a version held is Lisp, by the test Collate itself uses (`SW.collateLisp`, kit/compare.js). It named it wherever the kit's Lisp reader was loaded, as on the ELIZA bench, which loads it for Implementations though none of its versions is Lisp (reported by the ELIZA session).

## 0.74.2 (2026-10-21)

- Versions ▾: Collate's line names the modes the bench offers (`compare.modes`; the second mode where `compareDefs.by` gives a phrase for it, as `leaf`; By function only where the texts are Lisp), so that the Melville bench reads "Two versions collated: line by line and by leaf"; `SW.BENCH.words.collate` sets it outright (asked for by the Melville session). A bench that gives none of these reads as before, less By function where its texts are not Lisp.

## 0.74.1 (2026-10-21)

- Top bar: a bench without the version picker (`picker: false`) keeps its name and version at every width down to 380 px; the rules that hid them below 1240 px and 860 px, to make room for the picker, now apply only where there is one (reported by David on the Melville bench, whose name had gone from the bar on most laptop screens). The shell marks such a bar `.no-pick`.

## 0.74.0 (2026-10-21)

- **Versions ▸ Collate** in place of Versions ▸ Compare, for the two versions set out line by line, by routine or by function (David's decision), so that Compare names Book's side-by-side reading. The view keeps its name in links and settings (`tab=compare`, `SW.BENCH.compare`, `compareDefs`), so links and benches go on working; a bench whose own words name it (a Versions ▾ list of its own, a tour stop, a title in its index.html) changes them itself. My notes names the view Collate.
- Book: **Compare** in place of Compare with, its list reading "with" each text ("Compare with MEL reading text").
- The site: Collate and Book among what a bench does; the Melville entry describes Book.

## 0.73.0 (2026-10-21)

- Book, after 0.72.0 (reported by David): the toolbar's buttons did nothing (the texts, ◀ ▶ ▶▶ for the stages, ≡ Read here). The view carried the image size as data-img, so every click inside it was read as a click on an image-size button; the toolbar now finds its controls within itself, by their own ids. The phone-width rules of book.css, broken by the same release (a block of rules put inside them), are whole again.
- Book: **Images** is a slider for the pages' images' size and an **Off** that folds them away, the ▣ at each page break opening one; On brings them back at the size the slider had (asked for by David, in place of Large, Small and Off). Kept for the browser; in the address as `img=off` or `img=` a width.
- Book: **Compare with** in place of Beside (asked for by David; Versions ▸ Compare stays the line-by-line comparison). Holding two texts at the same page is lighter: each column's page breaks are measured once, again after a stage, the images' size or the window's width changes, and looked up as it scrolls; a column follows the other once a frame, and does not answer the scroll it was given (the manuscript beside the reading text was slow to scroll; reported by David).
- Book, a page's image enlarged: ◀ ▶ buttons either side of the image for the page before and after, large enough to tap, each disabled at the first or last page, and an ✕ to close; the arrow keys and Esc still work, a click on a button no longer closes the view, and the text behind follows to the page shown. The hint names the buttons (it named only the keys; reported by David).

## 0.72.1 (2026-10-21)

- tools/release.js: `next` refuses pages whose `?v=` is not a version number (a stamp left by testing, such as `c1`, gave the next release the version "c2"; reported by the Melville session); an explicit version (`release.js 0.1.12 "…"`) releases from such pages and must itself be one. The README's Version line is set to the release whatever it said before, so the summary agrees with what was written.

## 0.72.0 (2026-10-21)

- Book: **Images** ▸ Large, Small or Off, for the pages' images beside the text (asked for by David, to fold them away when reviewing). Off gives their room to the text and leaves a ▣ at each page break that opens the page larger, with its details. The choice holds for both columns with Beside, is kept for the browser, and rides in the address as `img`.
- Book: a reinstatement brings back the deletion it encloses, not a deletion further inside that one. A phrase deleted and reinstated that held a word replaced earlier showed both words at the later stages ("perceptableperceptible", "vaingloryvainglorious" on the Melville bench).
- The ◐ switch goes to the last theme of the other kind used in the browser only while that theme is still of that kind, or else to the bench's first theme of that kind. A browser that had seen a bench while its own theme was dark kept that theme as its dark one after the bench made it light, and ◐ then went from light to light (reported by David on the Melville bench, which had patched it in its core.js).

## 0.71.0 (2026-10-21)

- **Book** (new `book.js`, `book.css`), for a bench whose reader gives each version a document beside its lines (`b.doc`), built with the Melville bench (from its prototype, js/book.js) and abstract enough for any bench: the bench gives its stages, states, hands and words in `SW.BENCH.doc`. A version's text set as a page, in sheets, a page to each, with the page's image on the right, larger in a box with its lines and reference on a click (asked for by David). Moving between versions at its centre (David's instruction): the texts in a row; a version's states as one text, with a slider through its stages of revision, the revisions fading out and in as it moves, ▶▶ to run through them, and All revisions; a second text Beside the first, held at the same page as either is scrolled. A selection is the version's lines (Annotate, Copy citation, Copy link, Read), the group's annotations are marked on their lines, a place from one of the states is found in their source, and the state rides in the address (`stage`, `all`, `bb`, `l`). Read's selection bar has 📖 Book where the version has a document. README ▸ Book.
- Edition: a version with a document is typeset from it, a sheet to each of its pages, with its headings, verse, italics and its own notes, and the group's annotations as footnotes; a diplomatic version (`doc.diplomatic`, or the source of `doc.states`) has its additions raised and its deletions struck. The Word form has the same paragraphs.
- Tests: `tests/book.test.js`, 16 checks on an invented document, in run.js's list.

## 0.70.0 (2026-10-21)

- Top bar: `SW.BENCH.picker: false` leaves out the version picker with the version's reference and language, for a bench whose versions are chosen from Read ▾ (asked for by David, for the Melville bench). The frame no longer needs `#pick-a` or `#vref` on the page; a tour stop that outlines a missing element is passed over as before.

## 0.69.0 (2026-10-21)

- About box: no **Author** row (asked for by David); the kit's author is given on its repository and README, and the bench's project and leads in Project. `SW.BENCH.about.author` is still used for the citation.
- About box, Cite as: the bench is cited as the project's work, from `SW.BENCH.about.cite: { authors, title }` (the leads as cited, and the title), where the bench gives it (asked for by David); otherwise as before, from `citeAuthor` or `author` and the bench's title.
- About box: at its foot, in small capitals, **A Bench Kit project**, linking to the kit's repository (asked for by David).

## 0.68.1 (2026-10-21)

- About box: **Project** (the project the bench serves and its leads, `SW.BENCH.about.project`) is the first row; **Author** (the bench's author) moves down, after Code (asked for by David). A bench without a Project row starts at Version.

## 0.68.0 (2026-10-21)

- Help ▾: **About the bench** is always first, at the top level, not inside The project (asked for by David). A bench's list that moves or leaves it out still has it there.
- For benches whose texts are not code (asked for by the Melville bench, the first prose bench):
  - Compare offers the modes in `SW.BENCH.compare.modes` (all four by default), and draws no ignore-comments box where the bench has no comment mark (`comment: false` or `[]`, or `compare.comments: false`).
  - `comment: false` or `[]` means no comment mark, now documented; a bench that leaves `comment` out still gets `#`.
  - The annotation test of `SW.lineKey` is labelled "spacing set aside" where the bench has no comment mark.
  - `SW.BENCH.words`: `text` for the size toast ("Code text"), `font` for Settings ("Code font"), `source` for Read's column heading ("Source").
- About box: a **Project** row after Author, from `SW.BENCH.about.project` (HTML), for the project and its collaborators where these are not the bench's author (asked for by David, for the Melville bench). Benches without it are unchanged.

## 0.67.0 (2026-10-21)

- **Help ▸ Implementations** (guides.js), for a bench that sets `SW.BENCH.implementations`: what an entry records and its statuses; descent (relation, route, confidence, evidence); List, Read, Tree and Matrix, with the Tree's lines and nodes explained; Compare (features, texts by line, Lisp by function, side by side); what is published and what is held awaiting clearance; I-codes and links. In Help ▾ after Paratexts, and opened by `&help=implementations`. Help ▸ Codes, links and sharing lists the I-code where the bench has the tab. Until now the tab was described in the README only.

## 0.66.3 (2026-10-21)

- Menus: a submenu opens as soon as the pointer reaches its item (it waited 120 ms, or 260 ms with a neighbour's list open, which read as lag; reported by David). While the pointer is crossing other items on its way into an open list (inside the triangle from where it was to that list's near edge) the list stays and the items crossed do not open; an item the pointer stops on opens within about a third of a second. Open lists elsewhere close after 150 ms (was 320 ms) unless the pointer is heading into them.

## 0.66.2 (2026-10-19)

- Implementations: an entry can name its Lisp reader in `lispDialect` (bbn, interlisp, pdp6, maclisp, cl), for a text whose language field says one thing and whose file is written in another (Cosell's 1969/72 script packaged as runnable Common Lisp).
- lispdefs.js, Interlisp: ' is QUOTE at the start of an atom and a letter inside one, as the Interlisp DOCTORs of 1983 and 1985 write (YOU DON'T SEEM QUITE CERTAIN %.); the font changes in a pretty-printed Interlisp file (^F and the font's number) are left out of its symbols; Interlisp's PUTPROPS and Cosell's RPLQQ are read as properties, keyed like DEFPROP ("word RULES"), so scripts compare across BBN-LISP, PDP-6 Lisp and Interlisp. Cosell's SCRIP 4.1 tape of 1966 against the Interlisp-10 DOCTOR of 1983: 131 entries in common, 90 identical (125 and 81 with ' read as QUOTE inside atoms). Two collations, three checks.

## 0.66.1 (2026-10-19)

- lispdefs.js: a reader of its own for Interlisp (`interlisp`), as BBN-LISP's but with ' as QUOTE, the read macro Interlisp has and the BBN-LISP of the 1960s lacked; Compare and Implementations map Interlisp to it.
- lispdefs.js: in the bbn and pdp6 readers ' is a letter, not QUOTE. The ELIZA scripts of 1966 to 1972 (Cosell's BBN-LISP tapes, the PDP-6 adaptation on Samson's DECtape) write DON'T, YOU'RE and I'M plainly; read with ' as QUOTE, YOU'RE and I'M folded into YOU and I, and Implementations' Compare of the two Samson scripts fell from 123 definitions in common (115 identical) to 119 (111). White's Maclisp DOCTOR of 1978 writes DON/'T, so maclisp and cl keep ' as QUOTE. Two collations added (the Samson scripts; SCRIP 4 to Cosell's SCRIP 4.1 tape), two checks in tests/lispdefs.test.js.

## 0.66.0 (2026-10-19)

- **Implementations** (new `implementations.js`, `implementations.css`): the Implementations tab as a kit module, from the ELIZA bench's view (eliza 0.1.82), for any bench that sets `SW.BENCH.implementations`. The ELIZA-specific parts are now the bench's: root labels from the catalogue's `variorum`, the credit at the foot from `credit`, and a feature that needs more than yes or no (ELIZA's delimiters) through `feature: { cell, cls, key }`. Compare reads Lisp by definition through `lispdefs.js` (the dialect from the entry's language: PDP-6, BBN-LISP and Interlisp, Maclisp and its relatives, Common Lisp), marking an unbalanced definition. Alternates held privately are named, with the paratext that holds them. I-codes open through the kit's Go to a code. README ▸ Implementations sets out the catalogue, publication and clearance, and how a bench adds the tab.

## 0.65.3 (2026-10-19)

- Paratexts: a picture (or PDF page) in an item that has alternates, such as a transcript or a translation, showed an empty pane at "100%" (reported by David on the ELIZA bench, P-OO3ET). The zoom box sat in the inner pane's centred grid and, its picture being placed absolutely, had no width to fit to; it now fills the pane. The box is also laid out again whenever its size changes, so a picture that loads before its box is laid out is fitted when the box arrives.
- Tokens: what to do when the GitHub token is lost (another browser or computer, Safari clearing a site's data after seven days without a visit) or has expired, in ⚙ Settings, the join steps, Paratexts' own steps, the steps to send and Help: make a new one from the same form and paste it in; the old one can be deleted on GitHub. Asked for by David.

## 0.65.2 (2026-10-19)

- Tokens (reported by David: a GitHub token was lost between bench versions). Nothing in the kit removes a token, and the benches' storage prefixes have not changed, but three paths could overwrite or expose one, and they are closed. ⚙ Settings now writes a token only when the box differs from the token held, and an emptied box removes a token only after a confirmation; the join form's GitHub and Hypothesis buttons ask the same before removing one. The token boxes are marked autocomplete="new-password" (with the LastPass and 1Password opt-outs), so a browser's password manager does not fill them with a saved password. The backup file (My notes ▸ Back up) no longer includes the GitHub token, as it already left out Hypothesis's, and settings in it are keyed by the bench's own prefix.

## 0.65.1 (2026-10-19)

- Codes: an implementation's code (I- and five letters or figures) written in an annotation, note, finding or paratext description is a link, like A-, R-, C- and P- codes, and Go to a code (# in the top bar, ?code= in a link) opens it where a bench has Implementations (SW.implementations.open); elsewhere it says so.

## 0.65.0 (2026-10-19)

- **Compare ▸ By function, for Lisp** (new `lispdefs.js`). Where both versions are Lisp, Compare offers By function beside Text, the bench's Definitions and Routines: the two versions' definitions matched by name and compared as tokens, with parentheses, layout and case left out, so that BBN-LISP's DEFINEQ, Maclisp's DEFPROP … EXPR and DEFUN read alike. A row each: the definition, its kind, where it is in each version (as a reference), its length in tokens, the similarity, and identical, changed, only in A or only in B; fold unchanged hides the identical; a row opens the two definitions side by side in the side panel; Word and Markdown export. Readers for BBN-LISP and Interlisp, MIT PDP-6 Lisp, Maclisp (with Stanford Lisp 1.6 and Franz), and Common Lisp; definitions by DEFINEQ, DEFPROP, DEFUN, DEFMACRO, DE, DF, DM, Micro-Planner's theorems, SHRDLU's PDEFINE and DEFS, DEFLIST and Common Lisp's defining forms. A form left open where the next definition begins at the margin (a damaged copy, a lost parenthesis) is closed there and marked unbalanced. A version's dialect is its `lispDialect`, or its `dialect` or the bench's `lang` where these name a Lisp; a bench loads `kit/lispdefs.js` before `kit/compare.js`. The module stands alone, for the ELIZA bench's Implementations to use. Asked for by the SHRDLU session; from the ELIZA Implementations viewer's by-function compare, rewritten with a reader per dialect.
- `tools/collate-lisp.js`: the same comparison from the command line, and `--check` against expected counts. `tests/lispdefs-collations.json`: ELIZA's Lisp line (Cosell's DOCTOR of 1966 to the PDP-6 adaptation, 13 definitions in common and 2 identical; the PDP-6 adaptation to DECUS 10-105, 21 and 16; to White's Maclisp DOCTOR of 1978, 19 and 10; White's DOCTOR to Franz Lisp, 189 and 187) and SHRDLU's ITS and Stanford copies of GRAMAR (12, all identical), SMSPEC (32 and 29: the Stanford copy is damaged in SMONE3 and the function after it, read there as SMPORS2) and DICTIO (375, all identical). `tests/lispdefs.test.js`, 22 checks, in run.js's list.

## 0.64.1 (2026-10-19)

- Site map: a link in the tab row to a page of its own (`<a class="tabs-link">`, such as the ELIZA bench's Implementations) is listed under Tabs, with its title as the description. Asked for by the ELIZA session, whose Implementations page the generator was leaving out.

## 0.64.0 (2026-10-19)

- Paratexts: **standard terms for every type and medium.** Each kit type is mapped to the Library of Congress Genre/Form Terms or, where LCGFT has no term, the Getty Art & Architecture Thesaurus; each medium to an RDA carrier type, with the AAT term beside it where closer; each mapping marked exact, close, broad or narrow (SKOS), all checked against id.loc.gov and vocab.getty.edu. Presentation slides and Other have none. Shown in the item's box (Standard terms, linked) and the read-only box; exported in Dublin Core as `dc:type` and `dc:format` labels and URIs. ＋ New type… and ＋ New medium… take an optional standard term (`std: { uri, label }`). The bench's own labels are unchanged. The mapping table is in the README (Paratext rules ▸ Type and Medium).

## 0.63.0 (2026-10-19)

- Paratexts: **a new Type list, and Medium** (decided after review with the three benches). Type says what the thing is, in ten groups and 58 types. New types: magazine article, review, abstract or bibliography entry, program write-up, catalogue entry, specification, newsgroup or mailing-list post, log or logbook, legal document (taken in from the Spacewar bench), program on a carrier, advertisement. Exhibition now covers physical displays. Retired, with a label kept for the records that carry them: transcript (a transcript takes the type of what it transcribes), paper tape, punched cards, magnetic tape (now a program or an object with its Medium). **Medium** (new, optional) names the carrier: paper, microform, punched cards, paper tape, magnetic tape, DECtape, disk, ROM cartridge, data cassette, photographic print, photographic film, videotape, audio tape, born digital; it goes into Dublin Core's format and CSL's medium. **Extensible without a release:** ＋ New type… and ＋ New medium… at the foot of each list add one to the archive's own list (`types`, `media` in the catalogue), in one commit; a bench's config can still add types; a kit type keeps its definition over an archive's of the same id. A find box beside the Type list narrows it as you type. README (Paratext rules ▸ Type and Medium) and Help.

## 0.62.1 (2026-10-19)

- Paratexts ▸ ＋ Add an item, after testing: the three modes (A file, A link, Missing) now show only their own part of the box (all three showed at once). The Versions field is shown and starts empty; it was hidden under More metadata and filled with the version in view, so every item added was tied to it. A Type is required. A link's Shows as starts unchosen and must be chosen (it started at Video, so a page was catalogued as a video). A scan is no longer guessed to be a photograph. A stub gets the tags missing and to-locate. Program source (.lisp, .bas, .c and the like) is kept as text (kind software, text/plain) and shows as text in the box. A file of the same name and size, or a link already catalogued (url, archive link or identifier), is named before it is added again. When the record cannot be saved after the file is uploaded, the file is taken out again, so none is left without a record. Empty fields are not saved. The Dublin Core type field is labelled DCMI type (two fields were labelled Type). Small files show their size in bytes.
- Paratext rules ▸ Corpora: a corpus is a bulk set gathered by one collector or by one search (it said one source), and a program's early ports and reconstructions are named as paratexts. The same in Help ▸ Paratexts ▸ Corpora.

## 0.62.0 (2026-10-19)

- Paratexts: **corpora** (proposed from the ELIZA bench; schema from the SHRDLU bench). A corpus is a bulk body of material from one source, kept in the catalogue but out of the default list: declared on the catalogue as `corpora: [{ id, name, note }]`, each of its items carrying `corpus: "<id>"`; an item with none is a paratext, so a catalogue without corpora is unchanged and shows no new control. Where there is one: **Corpus** first in the bar and **Corpora** in the left panel, each with its count (Paratexts, each corpus, Every corpus); the count line, the left panel's counts and the empty-list message are of the corpus in view. A search covers every corpus and reports the rest through the hidden-by line ("3 more hidden by Corpus: Paratexts only", with Clear); Clear all widens to every corpus. An item from another corpus carries the corpus's name beside its title, in the list and on the card. An item has one home; a corpus may also list paratexts of its set, `also: [P-codes]` on its declaration: they stay paratexts (default view and counts unchanged), appear in the corpus view marked Paratexts, and the count gives the split ("42 in Versions, 10 of them also in Paratexts"; the left panel shows the total, the split in its tooltip); Every corpus counts each item once; a code not in the catalogue is skipped and one whose item has a corpus of its own is marked ⚠. Related links and the sequence editor's rows mark an item whose home is a corpus. Unscoped: byCode, Related and sequence links, Withdrawn, the Tag, Type, Language and Kind menus, and the export. Dublin Core: `dc:relation` "isPartOf: <corpus name>", for an item's home corpus and for each corpus that also lists it. An id not declared in `corpora` is marked ⚠ in the menu, the panel and on the item. In the README (Paratext rules ▸ Corpora) and Help ▸ Paratexts ▸ Corpora.

## 0.61.0 (2026-10-18)

- Paratext rules: **to locate and to request** (your request). Two tags with fixed spellings, `to-locate` (every stub; no holder known) and `to-request` (a known holder could be asked: an undigitised object in a catalogue, a finding aid, a stub with a likely holder), and a `Request:` paragraph in the description saying whom to ask and for what (holder, collection and number, part, form), before `Searched:` in a stub. In the README (Paratext rules, and the stub rule's description order), Help ▸ Paratexts ▸ Missing items, and the hint under ＋ Add ▸ Missing. No new field or display: Tag ▸ to-request is the worklist.

## 0.60.0 (2026-10-14)

- ⚙ Settings ▸ Paratexts: **Fetch ahead**, how many items either side of an open one to fetch into this browser: Off, 1 (the default), 2, 3, 5 or 10 each way, in the list it came from and in each sequence it is in, nearest first; its small alternates are fetched whenever it is on.

## 0.59.0 (2026-10-14)

- Paratexts: **fetching ahead** (your question). Once an item is open, the items either side of it (in the list it came from, and in each sequence it is in) and its small alternates (a transcript beside a recording) are fetched quietly, one at a time, into the browser's cache, so Back, Next and switching readings open at once; files over 25 MB (an alternate over 5 MB) wait until asked for. Two requests for one file now share one download. Unchanged: the catalogue is one file, kept in the browser after the first visit; a card's picture loads only as it comes into view (images under 6 MB); a file only when its item is opened, then cached.
- Paratexts: the **sequence editor** (your request): a box to make and change sequences whole, from Sequences in the left panel (＋ for a new one, a name to edit it), from a sequence's name in an item's box, or from ticked items (⛓ Sequence… in the selection bar adds them, in the list's order, at the end). Name, note, members in order (drag a row, or ↑ ↓; ×), Add by code or by title, Save in one commit, Delete the sequence (its items stay); closing with changes unsaved asks first.
- Paratexts, missing items: the description's last part is **Searched:** (your wording; it was "Looked for:"), in the Add ▸ Missing prefill, the README rule and Help.

## 0.58.0 (2026-10-14)

- Paratexts: **Related** items (your request, via the SPACEWAR! session): links with no order, `related: [P-codes]` on each item, written both ways. Listed in the item's box like Cited in, each opening the other; ＋ Add… (a code) and × link and unlink both ways; codes not in the catalogue skipped; Dublin Core dc:relation "references: <code> <title>". A bench save keeps the field (checked). README (Paratext rules ▸ Sequences) and Help ▸ Paratexts ▸ Stepping through.

## 0.57.0 (2026-10-14)

- Paratexts: **stepping through** (your request, via the SPACEWAR! session). An item opened from the list has ‹ Back · 12 of 56 in Photos · Next › under its title, through the list as it stood (collection, filters, search, sort), and ← → step. **Sequences**: fixed orders across collections and filters (a run of logbooks, a deposition's volumes), kept on the catalogue as `sequences: [{ id, name, codes, note }]`; an item in one has a bar for it too, with any stub in the run shown as itself in its place; Sequences ▸ ＋ Add to… (or a new one), ↑ ↓ to reorder, × to take out; exported to Dublin Core as dc:relation isPartOf. In the README (Paratext rules ▸ Sequences) and Help ▸ Paratexts ▸ Stepping through.

## 0.56.1 (2026-10-14)

- Paratexts, missing items: the wording is "Provenance found but item not available or missing" (your wording), in small capitals: the box's heading, the first line of a stub's description (the Add ▸ Missing prefill, and the README rule, which asks for the line exactly so stubs can be found by it), and in Help; the card's chip reads **Not available or missing**, the full line in its tooltip. It had been "Missing: not held, to be located" and "Missing · to locate".

## 0.56.0 (2026-10-14)

- Paratexts: **what a filter hides**. When a filter (Tag, Version, Type, Language, Kind, or the collection open on the left) hides items that match the rest, the count says so and names it, with a button to clear that one filter: "12 of 255 · 3 more hidden by Language: German [Clear Language]"; an empty list says "None with these filters. 1 match is hidden by Language: German [Clear Language] [Clear all]". Nothing is reset under the reader, and a search is never counted as the culprit. (A stub catalogued in English could not be found with the Language filter left on German, and was taken for not created; the ELIZA session's account and proposal.)
- Paratexts: a stub's description, and any reading taller than its box, starts at the top: the box centred what it shows, so a long text overflowed upward and its first lines could not be reached.

## 0.55.0 (2026-10-14)

- Paratexts: **missing items**. A stub records something known to have existed that the archive holds no copy of and no link to (`kind: "missing"`, no file, no url): ＋ Add an item ▸ **Missing**, with a description begun for it (missing and to be located; what it is; where it is cited, as the citing paratext's code with the page and a quotation; where it has been looked for), and refused without a citation. Its card shows ❔ and **Missing · to locate**; its box shows the description, each code a link to the citing item; Kind ▸ missing lists them. The rule is in the README (**Paratext rules ▸ A stub for a missing item**: check that it existed from a source read at the page; a located but undigitised object is a link, not a stub; something planned and never made is not a stub; when a copy turns up, add it as its own item and withdraw the stub with the new code as the reason) and in Help ▸ Paratexts ▸ Missing items.

## 0.54.0 (2026-10-13)

- Paratexts: the **Language** filter finds an item by any language it can be read in, its own and any translation held beside it (an alternate in another language); it had read the record's own language only, so a German item with an English translation was hidden from a reader filtering to English. A card marks each translation (EN · machine translated, from the translation's note), so an original and a translation are told apart; the record's own Language field stays the original's. On the ELIZA archive: German 69 (every German original), English 218 (184 originals, 34 translations).

## 0.53.7 (2026-10-13)

- Ratings: under the pointer, the rating a click would give. Every star up to the one pointed at fills, and the rest empty, on the cards and wherever a rating is set; only the star under the pointer had changed.

## 0.53.6 (2026-10-13)

- Ratings: a star not given is fainter (its outline at 45%), so the gold of a star given stands out; under the pointer it shows at full strength.

## 0.53.5 (2026-10-13)

- Ratings: a star given is a little brighter than the gold of the repairs (`--star`: #e9c547 on the dark themes, #c29a12 on paper, white and sepia; falls back to `--kin`).

## 0.53.4 (2026-10-13)

- Ratings: a star given is filled in gold, a star not given is an outline, on the paratext cards and wherever a rating is set (the item's record, annotations). On the light themes the pale fill of an unrated star could not be told from the gold.

## 0.53.3 (2026-10-13)

- Paratexts: an embedded player (YouTube, Vimeo, the Internet Archive) or a video fills the width of the view, in an item, in one with alternates, and in the read-only box. The view centres what it shows, and a player sized by percentage inside the centred box had shrunk to a small frame in the middle.

## 0.53.2 (2026-10-13)

- Paratexts: ☰ Download and GitHub ↗ follow the reading showing. Reading a transcript, Download gave the recording, under the recording's name; it now gives the transcript, under its own file name, and says which (⤓ Download transcript, ⤓ Download audio). A download started as one reading loads never lands on the reading switched away from.

## 0.53.1 (2026-10-13)

- Paratexts, the grid: each thing in the same place on every card, for scanning. The code and the rating on the top line (the rating at its right, with reactions and comments), the title (three lines at most, the whole in the card's tooltip), the type and the date on one line (a date never broken), the tags (two lines at most), the collections at the foot. The rating had sat among the tags, wherever the title's length put it, and a date could break across lines.

## 0.53.0 (2026-10-13)

- Paratexts, Add an item › A link: **Shows as** has Text file, Code and Other beside Video, Audio, Image, PDF and Web page. A linked text or code file is shown as text where the place it is held lets the browser read it (GitHub's raw files do), with its link under it; elsewhere, and for Other, the link. The address suggests the kind (.txt, .md, .srt; .bas, .lisp, .mad, .c, .py and other source files), and Code suggests the Type Software or source code.

## 0.52.0 (2026-10-13)

- ⚙ Settings › You: **Tell me when a newer release is live**, on by default. Turned off, the newer-release bar no longer appears in that browser (kept as `freshBar`), and one showing goes on Save. `SW.BENCH.freshness: false` still turns it off for a whole bench.

## 0.51.1 (2026-10-13)

- The newer-release bar looks again every five minutes (it was every half hour) and on coming back to the tab, at most once a minute; a page left open through a release had gone without it for up to half an hour, longer in a background tab. A later release still updates the bar; ✕ puts off that release, not the next (it had silenced the bar for the life of the page).

## 0.51.0 (2026-10-13)

- Paratexts: an item's readings are a row of buttons, one each, all in view, the one showing marked; the two-reading flip of 0.50.0 showed only the reading you were on (an audio record read **Audio**, its transcript out of sight). Names: the record by its kind (Scan, Audio, Video, Text), **Original** where it is a text with only translations beside it; an alternate in the record's language a **Transcript** of a recording (**Subtitles** for .srt or .vtt), a **Scan** or a **Text**; one in another language the **Translation**, or by its language where there are several. ELIZA's broadcasts: Audio · Transcript · Translation. The caption leaves out a title the button already gives.

## 0.50.1 (2026-10-13)

- Paratexts: the switchers above an item's view stay at its top left. The view centres what it shows, and the bar, sized to its own width, had moved with each reading: centred over a scan, at the left over a short text, pushed right by a long one.

## 0.50.0 (2026-10-13)

- Paratexts: an item's alternates switch as the bench's other readings do. One alternate is a two-state flip, **Original | Translated** where its language differs from the record's, **Text | Scan** and the like where it does not; more than one is a row of short labels, a language among translations or the kind of thing (P-JUFYC: Scan | DE | EN). An alternate's `short` names it in either. Its label and note, which had been inside the button and ran off the edge, are a caption under the switcher, in full, for the reading showing; the original has none.
- Paratexts: **Catalogued** is one line under More metadata: who catalogued it, in a box that can be corrected, and when it was last changed and by whom beside it.

## 0.49.0 (2026-10-13)

- Paratexts: an item's Download, GitHub ↗, Open ↗ and Source ↗ under ☰ in its header, beside Share and ＋ My notes; the menu closes on a choice or a click elsewhere.
- Paratexts: **Catalogued by** is a field under More metadata, which can be corrected, with the last change (when, by whom) under it; it no longer sits below the collections.
- Paratexts: closing an item with changes not saved, or a comment not sent (✕, Esc, a click outside, or a citation link), asks first: Keep editing, Discard, or Save. The Add box asks too, before what has been entered is lost.
- The paratexts guide says what a collection is for: a grouping someone has to judge, which no field records; where a field says it (type, language, date), the filter of that name. The README notes that the Language filter appears only once a catalogue holds a second language.

## 0.48.0 (2026-10-13)

- Read ▾: a bench that groups its files (`SW.BENCH.readFiles`: groups by a test on a file's name, one taking the rest, and a description of each file) has the versions in a submenu, then the open version's code by part, each file opening in Read (SHRDLU: SHRDLU, PROGRAMMAR, Micro-Planner).
- Paratexts: a **Language** filter beside Type, by name (German, not de), from the languages the catalogue has; it reads the record's own language, not a translation's; the search reads it too. `SW.BENCH.paratexts.languages` adds names.

## 0.47.0 (2026-10-13)

- The newer-release bar compares the version on the live page's `kit/base.js`, not the page's first `?v=`: SHRDLU's sharing image (`DB-Card.jpg?v=2`) came first, so every SHRDLU page said a release "v2" was live, at every load.
- Read ▾ by default (a bench without layers): the versions in the version picker's groups, each opening in Read, another reading of a version under it in a submenu; more than ten versions take a submenu for each group, naming its versions.
- Menus: three marks no longer taken for one another. The item under the pointer is filled; the item whose submenu is open is filled more lightly, its ▸ lit; the place you are now has a bar at its left and its name lit, no fill (it had looked like the open one). A pointer on its way into an open submenu no longer opens the neighbours it crosses, and switching to a neighbour waits a moment longer while one is open.

## 0.46.1 (2026-10-13)

- `tools/release.js` sets the page's `bench-date` to the release's day (the local day), which Help ▾ and About show beside the version; it had been left as it was, and went stale.
- `sitemap.js`: a submenu's opener heads its items in the site map, as a group heading did, so Help's and Graphics' groups are named there again.

## 0.46.0 (2026-10-13)

- Help ▾ and Graphics ▾ in submenus, one for each group, its first items named under it (`SW.menuFirst`); Help's long first group is two, Reading the bench and Annotating and sharing. The version line stays at Help's foot.

## 0.45.0 (2026-10-13)

- Menus take **submenus** (`SW.menuSub`): an item that opens a list beside it, on a pointer's rest, a click or a tap, or →, closed by ← or Esc, placed against the window so the menu's scrolling cannot clip it, opened in place on a narrow screen; they nest, and ↑ ↓ move through a list.
- `layers.js`: Read ▾ is a submenu for each layer, naming the version chosen in it, in `readOrder` (a bench's order for the menu only; the layers' list keeps the stack's order, which `?stack=` links follow); a layer's `groups` ([{ label, note, ids | line }], a line of descent stating a grouping once) gather versions in a submenu of their own; the current version's mark, the · on a layer's chosen version, `shown`, `more`, the breadcrumb and ◀ ▶ are as they were.

## 0.44.4 (2026-10-13)

- The top bar's small print (the bench's version, the reference and the language line) takes the bar's own ink, dimmed, in every theme: it had the page's faint grey, which on the paper theme's blue bar was all but invisible (contrast 1.4) and below 4.5 in most others.

## 0.44.3 (2026-10-13)

- No specimen that looks like a real identifier anywhere in the kit: the code shown in the Go to a code box, the paratext guide, the codes guide and two comments now give the shapes (A-XXXXX, C-XXXXX, P-XXXXX, XX-N1), the group comment in notes.js says in words where a link carries its ID, and the README's example config has an empty group, not a real one.

## 0.44.2 (2026-10-13)

- No made-up Hypothesis address in the kit: the joining guide and ⚙ Settings showed a made-up group address as an example, which was taken for a real, out-of-date link. They now ask for the group link from the invitation.

## 0.44.1 (2026-10-13)

- Help ▸ Paratexts: **Getting access** now carries the token form itself, with the step GitHub will
  not take from a link (Repository access ▸ Only select repositories ▸ the repository) called out,
  and a new **Inviting someone** section with a button that copies the steps to send. It says what
  the link cannot: that the member must be in the organisation first, that the token is read and
  write so every holder can add and withdraw paratexts, and that tokens expire after a year.
- ⚙ Settings: beneath each token box, the place to get one. Paratexts gains **Open the token form ↗**
  and **Copy the steps to send**; Annotations gains **Open the token page ↗** and the same copy
  button, over a new `SW.notes.joinSteps()`. The steps are built by the module that owns each
  service, so the group, the organisation and the repository stay right if any of them is renamed.
- `SW.paratexts.STEPS` is exported beside `SW.paratexts.TOKEN_URL`.

## 0.44.0 (2026-10-13)

- Paratexts: **a type for every item** (`genre`), what the thing is beside its file's kind (a memo scanned to PDF is a memo): 51 types in seven groups (texts, from article, book, thesis and working paper to memo, letter, electronic mail, minutes, patent, finding aid and press release; computing, from program listing and printout to punched cards, paper tape, magnetic tape, software, repository and dataset; images; sound and moving image, oral history among them; objects; the web; other), each mapped to its DCMI, CSL and RIS types for export. Chosen when adding (guessed from the file or the link where none is chosen) and in the record; a Type column, sort and filter in the list, a chip on the card, read by the search. `SW.BENCH.paratexts.genres` adds a bench's own. A link shows as video, audio, an image, a PDF or a page.
- Paratexts: the list's rows in alternate shades.
- Two-state switches on the toolbars (`SW.flip`): Normal / Expand for the card lens's contractions in Read, in step with View's choice; Kintsugi / Leiden for a paratext's gaps, reading the page in the notation a quotation carries. Each shows only where it has something to switch, and keeps its state for the bench.

## 0.43.1 (2026-10-13)

- The card lens, written short: a spelled-out statement is matched on the whole line (its words are drawn apart, so VECTOR VALUES and END OF FUNCTION had never matched) and only where a statement begins, after the label or a comma, so a mode such as INTEGER in NORMAL MODE IS INTEGER is not taken for the INTEGER statement.
- The card lens: a written-out contraction's mark also says what the source warns it is not (`SW.BENCH.columns.expandNot`), so an expanded P'T reads PRINT FORMAT, "not PRINT COMMENT, PUNCH FORMAT or PRINT ON LINE FORMAT".

## 0.43.0 (2026-10-13)

- Read: **the card lens**, for a bench whose files are fixed-column listings (`SW.BENCH.columns`: a layout of label, flag, text and sequence fields, 1-based, by file; contractions to write out, with their source; a note). Under View: the sequence numbers in a gutter of their own, hidden, or as held; a column ruler with its fields shaded; continuation cards joined to their statement, folded under it with their own lines and annotations kept, a click on the statement selecting all its cards and a link to a folded card landing on its statement; contractions written out or spelled-out statements written short, over the whole view and marked, an open contraction showing its readings, a copy carrying Leiden's form (`W(HENEVE)R`). A bench's `hl(raw, b, o)` is given `o.cut`, the column where the identification field begins, and draws the line up to it.
- `lang-mad.js`: the identification field begins where the bench's layout puts it (`SW.BENCH.columns.layout.seq`), else at column 73; an edition laid out otherwise no longer loses statement text past column 72 (ELIZA 1965b's `T'O MATCH`).
- Help ▸ Marks and conventions: the abbreviation row no longer says a bench writes MAD's contractions out with Normalised text; none does yet.

## 0.42.0 (2026-10-13)

- Paratexts: **lacunae**. A record or an alternate carries `gaps: [{ id, at, kind, cause, note, extent, label, fill }]` (at: `{page, printed}`, `{pages}`, `{lines}`, `{after}`, `{t}` or `{bytes}`; kind: missing, illegible, redacted, damaged, withheld; fill: `{text, basis: 'witness' | 'conjecture', by, date, source}`). Each is drawn where it is, as a seam in kintsugi's gold, not closed up: in a text, a band in place of the lines, with the kind, the extent, the place, the cause and the note behind it; over a PDF page that failed, with the page counter saying so; on a strip under audio and video, said aloud when playback reaches it. A fill sits inside its seam, never in the text, from another copy (dashed) or by conjecture (solid), with its source. A strip above each witness goes to its gaps. A selection copied across a seam takes its Leiden form. The card counts the gaps; a search reads their place, cause and note, and a match only in a restoration is flagged. Dublin Core, CSL-JSON and RIS carry each loss once (a shared id is one loss), in Leiden, a loss shared by several witnesses placed in each: `lacuna [--- c. 46 lines ---]: missing, after line 1204, the original; printed p. 219 (page 29 of the file), The scan; The camera failed on this page.`
- Help ▸ Marks and conventions (`helppages.js`, `SW.marksHelp`): one table of the marks the benches draw for losses, restorations, corrections and doubtful readings, each with its Leiden form for export, beside the kintsugi of the repairs, and as Markdown. `SW.leiden(id, text, o)` gives a mark's Leiden form to an export. `SW.BENCH.marks { uses, add, note }` adapts it to a bench.
- Paratexts: the text no longer paints over the language row. With a row above it the view is two
  rows, and a tall item centred in the capped second row had its top above the row, out of
  scroll's reach, so the middle of the text was drawn across the buttons. The preview now
  stretches and does its own scrolling, and centres its own content for a picture or a PDF.
- Paratexts: in side by side the panes' text carries its language too, an alternate's own `lang` or
  the record's `language`; one renderer now serves the item view and both panes.

## 0.41.1 (2026-10-13)

- Paratexts: switching to an alternate shows the alternate. The blob-URL cache was keyed by the
  record's code, and an alternate carries its record's code, so every translation was handed the
  original's bytes and no request for its own file was made; the cache is now keyed by code and
  file. Caught by the SHRDLU bench against a stubbed GitHub.
- Paratexts: the original's rendered text carries the record's `language` as its `lang`.

## 0.41.0 (2026-10-13)

- Paratexts: a paratext can carry **alternates**, a translation, a transcription or an OCR reading,
  kept beside the original under the same code and in the same record rather than catalogued twice.
  The record gains an optional `alts` array of `{lang, label, file, mime, size, by, date, note}`,
  `lang` in BCP 47; a record without it renders exactly as before. A language row sits above the
  view, the original first; the rendered text carries its own `lang` so hyphenation and screen
  readers behave. Where a translation is not a published one the row says so, "machine translation,
  unchecked" or "working translation, by X, date", so that it cannot be quoted as if it were.
- Side by side takes `CODE#N` as well as `CODE`, so an original and its translation can be set
  against each other in the two panes.
- A translation's language, label and note are searched with the rest of the record; the text of an
  alternate is not yet searched.
- Export: alternates leave with the record, as `dc:relation` entries of the form
  `hasVersion: <label> [<lang>] (<note>)`.

## 0.40.1 (2026-10-13)

- Paratext ratings: the stars on a card work. Each carried its paratext's code as `data-c`, which the list reads as a collection, so a click on a card's star was taken as a click on a collection named after the paratext: the list emptied and nothing was rated. The code is now `data-rcode`, and the stars are handled before any collection row.
- Paratext ratings: a star clicked is shown at once on the paratext's card and in its open panel, averages included, and held until its own save is written, so a save that returns while a later click waits no longer paints the earlier rating back, and a second click during a save no longer reads the catalogue that save fetched afresh (0.40.0's stars could jump back).

## 0.40.0 (2026-10-13)

- Ratings no longer wait on the network. The panel had its own rate handler that ran first,
  disabled the button and rebuilt the whole bar after a fetch and a write, so the stars only
  moved once both returned; card and panel now share one handler that paints first and saves
  after. Rapid clicks coalesce, so three stars in a row is one save rather than six round trips
  in a queue.
- A double-click anywhere in a find field selects the whole of it, in every bench and every
  view, rather than the word under the pointer.
- Paratexts: the stars on a card are now live. Click one to rate the paratext without opening it,
  click the same star again to take the rating back. The card shows your own rating and the crew's
  average beside it, and the stars fill before the save returns. The averages on the cards and in
  the panel are repainted once the save lands.
- Paratexts, the item panel: only Title, Date, Creator, Source, Description and Tags stay in
  view. Held at, Archive ref, Archive link, Online at, Rights, Accession date, Versions and
  References move behind the chevron with the Dublin Core fields, which now reads "More metadata
  (archive, rights, Dublin Core; N filled)".
- "Date made" is now "Date".
- Paratexts, the item panel: the reactions fold away. Only the emoji someone has actually chosen
  are shown, with the rest behind a `+` menu; the stars stay in view and now fill as you click,
  before the save returns, so a rating no longer feels laggy.
- "Catalogued by" is a field row like the others rather than a line of prose under Collections.
- "Cited in" is left out entirely when nothing cites the paratext, instead of printing a notice
  saying so.
- The panel is tighter: less space between the fields, the collections, the action row and the
  reaction bar.

## 0.39.1 (2026-10-13)

- `SW.mainPart(part)`: a version's main file, its program or a witness read as text; Compare, the reading edition, the tours, the functional overview and the records count a `text` part as main (0.39.0 left it out of Compare's text view).

## 0.39.0 (2026-10-13)

- `tools/ocr.swift` and `tools/ocr-vote.js`: a draft transcription from a scan, by Apple's Vision text recognition (macOS), and from many copies of one page the reading most copies give, line by line, with indents kept (from the ELIZA bench's 32 ditto copies of a 1965 conversation).
- `shell.js`: where the page the browser holds is an older release than the one live (GitHub Pages lets a browser keep it for ten minutes), a bar offers to reload; looked for a few seconds after opening and every half hour. `SW.BENCH.freshness: false` turns it off.
- A file's role may be `text`: a witness read and compared as plain text (a transcript, a conversation, a log), whatever the bench's language; a line opening with `SW.BENCH.textNote` is a transcriber's note. The language adapters compare it as they do a program. `SWVersionList.skipHead(mark, test)` makes a `findTitle` that starts a file past a note at its head.

## 0.38.0 (2026-10-13)

- `catalogue.js` (from the ELIZA bench's scripts catalogue): a table of what is known to have existed, held here or not, with search, filters, sorting, named subsets, links to the versions held, and a column for whether an entry is in the source the catalogue follows. Its styles are in `bench.css`.
- `layers.js` (from the ELIZA bench): code in layers, with Read ▾ by layer, the stack of versions chosen, names looked up down the layers, ◀ ▶ history, the breadcrumb and a layer's forms. `read.js` takes its toolbar from it where the bench gives none. Its styles, and the name pop-up's hover-card classes (`.pop-what`, `.pop-sec`, `.pop-row`, `.pop-go`), are in `bench.css`.
- `read.js`: a version opened at a line is drawn there: the listing goes to the selection before the browser paints, so it is never seen at the place the last version was scrolled to; a version opened with no line selected starts at its head.
- `read.js`: a row in a name's pop-up selects its line, as a click on the line does, so the link follows.
- `tools/kit-release.js`: a release of the kit itself, the version in `base.js`, a changelog heading over the notes under "Unreleased", and a tag; `tools/release.js` warns when the kit's tag and `base.js` disagree (0.37.1 to 0.37.4 left `base.js` at 0.37.0).

## 0.37.4 (2026-10-12)

- `compare.js`: `SW.genealogyLine(id)` turns the genealogy's flow to a line of descent from elsewhere (the ELIZA bench's named subsets).

## 0.37.3 (2026-10-12)

- `versionlist.js`: the default loader asks the bench's `findTitle(lines, b)` where each file's text begins, so the comparisons and the genealogy leave out a note set at a file's head (the ELIZA bench's transcribers' headers).

## 0.37.2 (2026-10-12)

- The tests: a line of descent that lists its versions has no tip to reach.

## 0.37.1 (2026-10-12)

- `versionlist.js`: a line of descent may list its versions (`ids`, in order) in place of a `tip`, where no descent is known: the ELIZA bench's DOCTOR copies, two tapes printed the same day and not ordered.

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
