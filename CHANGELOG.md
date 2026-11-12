# Changelog: bench-kit

## 1.9.1 (2026-11-12)

- **Glossary renderings separated by a comma** (David, via kuki): an English cell was split on ";" only, so "basis, foundation" was one rendering, never found in the translation, and the Glossary called it not in the translation though each word occurs there 40 times. A cell is now split on "," as on ";", in a Markdown table and in glossary.csv, and each part is counted and warned of on its own. A description beside a rendering goes in brackets, where it is a note: "decision; determination (in the causal sense)".

## 1.9.0 (2026-11-09)

- **1.8.29 renumbered** (David): the same code as 1.8.29, released as 1.9.0. A bench on 1.8.29 can move to 1.9.0 with no other change.

## 1.8.29 (2026-11-09)

- **A Glossary that tells renderings apart by case** (David, via kuki): `translation.glossary.caseSensitive: true` reads a rendering with its case, for a translation that keeps two terms apart by a capital (Ground for 根據, ground for 理由): the ⚠ no longer marks the pair, and each one's places in the translation are counted apart. Without it the Glossary reads without regard to case, as before.
- **The Glossary's sort tips name their column as it is headed** (kuki): "Sort by English", not "Sort by english"; Source and Reading likewise.

## 1.8.28 (2026-11-09)

- **The test page leaves the bench's loans alone** (Melville): the checks set the bench's Library store aside and put it back, but the library kept their loans (S-1, S-2, by TT) in memory and a later save wrote them into the bench's store, so its To read tab counted works it does not have. The writes came from the group's answers arriving after a Library view had been taken off the page, which still drew its cards (writing their paper and age) and saved its loans; a view no longer on the page now neither draws nor writes. The record in memory is also let go each way (L.forgetLoans), and putting back waits for the checks' last writes.
- **The figure box tests wait for the download** (Melville): "PNG saves one file" and "as an .svg" waited a fixed 400 ms, which a page in the background could run past; they now wait for the file (up to 15 s). Test only.

- **The Glossary's ⚠ says what it means** (David, via kuki): it was a span with a short title ("Also renders 理由") and no sign it could be pointed at; it is now a button with a help cursor whose words, "Renders more than one source term", show on hover, on focus and on a tap (the other terms are in its label for a screen reader). A row is no longer warned of a source term it holds itself (樣相 / 樣相性 beside 樣相性, both "modality").
- **The Glossary sorts by Source, Reading or English** (David, via kuki): a heading clicked sorts by it, again reverses, a third time returns to the glossary's own order; English without regard to case, Reading by its romanisation with the macrons folded, Source by its characters.

## 1.8.27 (2026-11-08)

- **The card catalogue and the gallery put away on the To read shelf** (David): they are ways into the whole library, and the shelf showed its cards under them; on the To read tab their buttons are hidden and Covers is marked, and they come back with the Library tab.
- **The chosen button in a group shows its whole border** (David): the next button's border was drawn over its right edge (the M of S M L, for one).

- **Reactions as the annotations show them** (David): the box of a work in the Library and a finding's box showed every emoji, used or not; they now show only the reactions someone has left, each with the initials of who left it, then ☺+ to open the rest, as annotations do (N.reactRow). Paratexts already showed only those left.

## 1.8.26 (2026-11-08)

- **The back of a book card is the front's paper** (David): the back took a fixed cream; it now takes the card's own paper, its yellowing with use and its worn edges, with the ruled lines over them. A catalogue card's back takes its white.
- **The Renew menu on a card reads in dark themes** (David): it took the theme's dark ground under the card's dark ink; on a card it is now a slip of light paper in every theme.

## 1.8.25 (2026-11-08)

- **To read shelf fixed for loans from before 1.8.16** (David): a line with no ink of its own was given a stamp colour through a signed shift, which for many lines found no colour, and the shelf stopped drawing; the library's covers were left in the list without their shelf, under the To read tab, counted as the library. Fixed, and the shelf is now made whole before the list is touched.
- **Wipe my loan history** (David): Settings ▸ Library has a button that takes every work off the reader's To read shelf and clears their reading log and their lines on the book cards, in this browser and, for a member, their loan records in the group, one at a time. It asks first, with the count; other members' loans are kept.
- **Book cards turn over again** (David): the yellowing of a well-used card was a filter on the card, which flattens its turn so the back never shows; it is now mixed into the paper's colour.
- **The image-queue tests wait for the queue** (Melville): "all asked for in the end" and "a failure asked again, then given up" now wait until the queue has finished (up to 15 s) instead of a fixed 700 ms, which a page in the background, its timers slowed, could run past. Test only.

## 1.8.24 (2026-11-08)

- **A work's notes panel only when it has notes** (David): a work with none opens in one column, with Add note and the stars at the end of its row of actions; pressing Add note slides the notes' panel out with the box to write in ready. A work with notes opens with its panel as before. In Paratexts, a work with no notes shows Add note in place of the empty frame. The empty quotation bar (a rule and a ✕) no longer shows above the box to write in when no words are quoted.

- **The library card, smaller, with the bench's whole name** (David): the card in Settings ▸ Library is 320 px across (was 380); the bench's name across its top is sized to its length and then to what it measures, on two lines where one would make it too small, so it is never cut off.

## 1.8.23 (2026-11-08)

- **Rating, key work and level in the lists** (David): the gallery's rows show a work's Key Work mark, its stars and its level (Essential, High, Medium, Low, Minimal; nothing for Not Checked); the list view adds the level to what it already showed. Essential stands out in red, High in the theme's accent, the rest fainter.

## 1.8.22 (2026-11-08)

- **A long library drawn a part at a time** (David): the covers and the list draw the first 150 works, and the next 150 as the reader comes within two screens of the end, instead of every work at once (Melville's 3,929 were all drawn on opening); the gallery's rows off screen are not laid out until near.
- **Covers show at once** (David): a cover's image fades in when it has come, the drawn cover (its kind, title and author) standing until then, and in place of one that does not come; in a work's box the cover's place is held, on the paper's colour, until it arrives.
- **Colour in a work's box** (David): the title in a lighter band with a rule under it, the record's labels in a muted tint of the theme's accent, and the notes on a shaded ground of their own; in light and dark themes, in the dialog and in the gallery's pane.
- **The gallery reads ahead** (David): when a work is shown, the five after it and the two before are asked of the group, and their covers fetched, so their notes, ratings and reactions are there when the pane reaches them; with the arrow keys the row moves at once and the pane follows when the keys rest (120 ms), so holding a key does not build every box on the way.

## 1.8.21 (2026-11-08)

- **The Library's head on one line** (David): the Library and To read tabs and the toolbar share a line where the window has room, under one rule, and wrap to two only when it is narrow.

## 1.8.20 (2026-11-08)

- **The gallery's pane at narrower widths** (kuki-bench's report): the box's columns follow the pane's width, so Notes go under the record until the pane is 820 px wide, and the cover goes above the citation below 480 px; at 1024 px the citation had been squeezed to about one word a line.

## 1.8.19 (2026-11-08)

- **The Library's tabs pinned** (David): Library and To read stay at the top with the toolbar as the list scrolls.
- **Filters in a pane of their own** (David): on a wide screen the filters stay in view beside the list, under the pinned tabs, and scroll on their own; each heading is shut until opened (one with a choice in it opens), and stays as left. A funnel on the bar shows or hides them: hidden, the list takes the full width, and the choice is kept; on a narrow screen it opens and folds them above the list.
- **A gallery view** (David): the works in a list on the left, the one chosen shown in its box in a pane on the right, as a file browser's preview; the arrow keys, Home and End move through them, Enter opens the box over the bench.
- **The library card turns over** (David): clicked, the card in Settings ▸ Library spins to its back: holder, card number, member since (the first check-out), the bench's address, the Hypothesis group and account, the GitHub repository and whether a token is held, loans now and in all, a signature strip and the card's conditions.

## 1.8.18 (2026-11-08)

- **A report's or web page's title in italics** (ELIZA, against Cite Them Right): a report and a web page stand alone in a citation, as a book does, their titles in italics rather than quoted.
- **Settings ▸ Library** (David): at the top, centred, the reader’s library card, after a 1969–70 student card: the bench's name over a red ground, a seal with an open book, LIBRARY CARD, and a window with a number, the reader's initials and name embossed, and the year; it follows the You tab as it is typed. Below, sign book cards with your name or your initials, and when a work is due back soon (only when overdue, or 3, 7 or 14 days before).
## 1.8.17 (2026-11-08)

- **Export fixes** (kuki-bench's report): in `contributor`, a segment with no role word carries on the role before it, so editors and translators can be written family name first, one to a segment (`eds Amano, Teiyū; Omodaka, Hisayuki`); a role with no export field (introduction, essay, commentary) goes whole into the note instead of losing its words, and is not split at "and"; bracketed original script leaves no empty brackets; `parallel text`, `edited volume` and `anthology` export as books; `library-check.js --dir DIR`, or a folder given in place of a file, reads that bench's `library.json`.
- **To read cards head "Book Card | <author>"** (David): the name the card in a book's pocket went by; the reader knows which library they are in. A work with no author shows what leads its reference, and a work led by its title shows "Book Card" alone.
- **Works with no author, by Cite Them Right Harvard** (David, through ELIZA): the citation leads with the editors ("(ed.)"/"(eds)", from `contributor`), a newspaper or magazine's name (`in`), a web page's or report's organisation (`publisher`), or else the title with the year after it; a chapter gives "in", its editors and the book. Author order, By relevance, To read and the card catalogue sort on what leads, so these works file among the rest instead of at the end. Call numbers are unchanged.
## 1.8.16 (2026-11-08)

- **To read cards** (David, 2026-11-08): ordered by author unless the reader chooses, so a card stays put when it is renewed; each card has its own paper, creams and buffs a shade apart and now and then an orange one, and a card in heavy use yellows and darkens at the edges; each line has its own pen and stamp ink, kept with its check-out and sent with it to the group, and a card's paper and age are kept once chosen, so they stay the same (David); a full card does not grow: a white sticker goes over the old lines, faintly showing them, and clicking it shows every line; a crossed-out line fades in its own ink, not grey; a work due back within seven days, or overdue, is stamped on its card, and in What's new is an alert kept at the top (David); the head reads "Library: ELIZA" on one line; lines crossed out fade; renewing and returning are behind the bookmark, with the due date beside it, as in a work's box.
- **An Annotated filter in Paratexts** (David, 2026-11-08): **Notes**, All, Annotated or Not annotated, beside Kind, from the group's notes on each item; and it is named when it is what hides items.
- **Export fixes** (kuki-bench's report): editors and translators from `contributor` (RIS `ED` and `A4`, BibTeX `editor` and `translator`), other roles in a note; a book's or thesis's page count from `extent`; a name in its own script after a romanised form exports as the romanised form, so Zotero reads it; `kind: 'translation'` exports as a book.
- **A hidden needs-checking mark** (David, 2026-11-08): a work added by hand in the Library or Paratexts carries `check: "unchecked"`, unseen by readers. `tools/library-check.js` lists those, and role words in `author`, `pages` that is not a page or range, a missing title, and a scholarly work's missing author or date; `--checked` clears marks. The release tool says how many records want a look.
- Below 860 pixels, the Library's Filters button can be pressed again with medium covers (kuki-bench's report). The medium size and the line under a title share the class `lib-m`, and the line's rule put the whole shelf in a second column over the Filters button, since 1.4.0.

## 1.8.15 (2026-11-08)

- A view no longer repeats its menu item as a heading (David, 2026-11-08): the Library, Paratexts, Findings, Glossary, Changes, Search and a catalogue's title are kept for screen readers only, a line saved on each. The menu's current item is marked plainly instead: bold, with a heavier underline in the bench's colour and a tint behind it.
- The Library's description under its title is gone (David, 2026-11-08); a bench's `intro` still serves the preview card. **Library** and **To read** are drawn as tabs that look it: raised, the open one joined to the page with a coloured top (David).

## 1.8.14 (2026-11-08)

- A check-out with the group's token no longer shows twice on its card (David's report on 1.8.13). The catch-up for loans made before a token was set took a loan just sent for one the group did not have, while Hypothesis's search was a moment behind, and sent it again. A loan made with a token is now marked as sent, this browser's record of a loan stands for a minute after sending, and two check-outs of a work on the same day with the same due date read as one, which also mends cards already doubled. Each check-out and renewal now carries a reference, and an event whose reference has been read is not read again (David's suggestion), so a loan sent twice shows once. Where the group can be read it is the record, and this browser's copy serves a reader with no token or offline.

## 1.8.13 (2026-11-08)

- **Export from a work's box** (David, 2026-11-08): an icon beside Share gives RIS or BibTeX for that work, downloaded or copied. The toolbar's export, from 1.8.12, is gone.
- When GitHub no longer accepts the token saved in a browser, the Library says so in one small line (works the group added are kept there, and a new token shows them), with **Hide** until the token changes (David's report).
- **Due dates in What's new** (David, 2026-11-08): works on the reader's To read shelf due back within the week, and those gone back in the last week, each opening its work, and counted in the button; for readers with no token too. `N.addNewsSource(fn)` lets any part of the bench add lines; `SW.library.dueNews()`.

## 1.8.12 (2026-11-08)

- On the To read shelf, **Order** works, with Date due first, and the search box says it searches the shelf (David's report).
- On the To read shelf, the reading log folds behind a chevron, shut at first, and the filters column is gone (David, 2026-11-08).
- A card's back shows a note added from it as soon as the box closes, without turning the card twice (David's report).
- **Export to Zotero** (David, 2026-11-08): a download button in the Library's toolbar exports what is shown, the library, a search or filter, or the To read shelf, as RIS or BibTeX, downloaded or copied for Zotero's Import from Clipboard. `SW.library.toRIS(entries)`, `SW.library.toBibTeX(entries)`.

## 1.8.11 (2026-11-08)

- The back of a card (David, 2026-11-08): blank where the group has no notes on the work, and a small **Add Annotation** at its lower right on every back, the same in the catalogue and on To read, opening the work's box ready to write. The turn button no longer shows through from the other side.
- The Library's tests set aside a reader's stored view, order, size, catalogue browsing and loans while they run, and put them back after, so they pass on a bench someone has used (Melville's report).
- A library card's typed label keeps one size: the call number and code, one line of author and two of title, the rest in the tooltip (David, 2026-11-08).
- A cover no longer carries a count of its notes, which collided with the due stamp (David, 2026-11-08). The list still shows the count, and Show ▸ Annotated finds the works with notes.
- **A tidier Library toolbar** (David, 2026-11-08): **Library** and **To read** are tabs above it, switching between the whole library and the reader's own shelf, and All works, Held, For the group, Linked, Added and Annotated are one **Show** menu, hidden on To read.
- Small library cards on the To read shelf are now about half the width of medium ones, with the last three lines of the card (David, 2026-11-08).

## 1.8.10 (2026-11-08)

- **A card catalogue in the Library** (David, 2026-11-08): a fourth view, drawers by author, title, subject or relevance with brass plates and counts, a drawer pulled out to its cards on the rod, and a typed front card with call number, imprint, tracings, marks and stars. Arrow keys, Enter and Escape; a search opens the drawer holding the first it finds.
- A library card and a catalogue card turn over (↻) to the group's notes on the work, scribbled on the back (David, 2026-11-08).
- A loan made in a browser before the reader set the group's token is sent to the group, with its date, the first time the token is there (David's question).

## 1.8.9 (2026-11-07)

- The Library's intro under its title is its first sentence, in small type, with the whole in the tooltip (David, 2026-11-08). A bench can shorten its `intro` to one brief sentence.
- A library card's dates read NOV 07 26 (David, 2026-11-08).
- The To read shelf comes as small, medium or large cards, or a list, and a card's code and title open the work (David, 2026-11-08).
- **Call numbers** after the old shelf marks, such as `1966 W48e`, on each library card's label and up the spine of a drawn book (David, 2026-11-08). `SW.library.callNo(e)`.
- **A Library entry's actions as one row of icons** (David, 2026-11-08, through ELIZA): open in a new tab, download, where it is published, share, Key work (a flag, filled when marked) and To Read (a bookmark, filled while out), each with its words in the tooltip and for a screen reader. To Read opens a small menu, "Add to To Read:" 1, 2 or 3 months, or the due date and Return. An entry with only a link keeps a visible Open button. Copy link is gone: Share copies the link where a browser has no share sheet (David).

## 1.8.8 (2026-11-07)

- **A To read shelf in the Library** (David, 2026-11-08): a reader checks a work out from its box for one, two or three months; its cover carries a due stamp. **To read** shows a library card for each work, after the cards in a book's pocket, where a loan is renewed as often as wanted, given no date, or returned; past its date a work goes back. Below the cards, a reading log of every work the reader has had out with their own rating, and **Your notes**, a box of the notes they have written on works in the library. Kept in the reader's browser, and with the group's token synced through Hypothesis as annotations the group can read, so a work's card and box show the other members who have it out (David, 2026-11-08). `N.create` takes `private`; `N.itemLoans`, `N.setLoan` in `notes.js`; the snapshot tool never publishes an annotation the group cannot read.
- **A rating as yellow stars** (David, 2026-11-08): one to three stars, the average to the nearest star, in a Library entry's record and the list, for every reader. Hovering gives a member their own rating, and a reader with no token the average and how many rated. In the covers view, a small dark box in each cover's lower right corner. The Key work badge is smaller.

## 1.8.7 (2026-11-07)

- A failed read in a Library entry's box now says NOTES NOT UPDATED in small capitals (David, 2026-11-08), with Try again; the reason is in its tooltip.

## 1.8.6 (2026-11-07)

- `templates/library-snapshot.yml` uses actions/checkout and actions/setup-node v7 on Node 24, so its run no longer warns that Node 20 is deprecated (kuki-bench's first real run). A bench that copied it can change the three lines.

## 1.8.5 (2026-11-07)

- The Library asks for `library/group.json` only where `library.snapshot` is true, so a bench with no snapshot no longer logs a 404 (kuki-bench's report on 1.8.4). A bench using the snapshot sets it.
- A Library entry with no copy now says "Copy not held in the library, use the link above to view it." (David, 2026-11-08).

## 1.8.4 (2026-11-07)

- **Ratings, Key work marks and tags for readers with no token** (David, 2026-11-08): `tools/library-snapshot.js` reads the private group with a member's token and writes `library/group.json`, which the Library loads for everyone. No note text, replies, emoji or names. `templates/library-snapshot.yml` runs it each day, with the token as a repository secret. See `docs/library.md`.
- A failed read of the group's notes is no longer kept as "no notes" (Spacewar's report). A Library entry's box says the notes could not be read, with Try again, and the next look asks the group again. The counts, ratings, marks and tags no longer take a failed read for an empty group.
- A draft is plainly marked, "Draft: this browser only", on every note surface, and an entry's Notes fold opens when it holds one (from a note that seemed lost in a browser with no token).
- A cover with both the Preprint and Key work badges keeps them on one row, as Preprint and Key, so they no longer cover the title (ELIZA's report on 1.8.3). The list and the box still say Key work. A book's cover, which has no kind label, makes room above its title for a badge.
- **The bench's name on one line in the top bar by default** (David, 2026-11-08). The kit's rule now wins over a bench's own stylesheet that stacks the name, as SHRDLU's, ELIZA's and CCSbench's did. A bench that wants it stacked sets `.bar .brand-name` itself.

## 1.8.3 (2026-11-07)

- **Relevance set with a drop-down in a Library entry's box** (David, 2026-11-08), kept as a tag in the group's annotations, so members can change a level at once. A tag naming a level comes before the `relevance` field, which stays what readers outside the group see. The level shows in its drop-down and filter, not among the tags.

## 1.8.2 (2026-11-07)

- **Relevance levels are now Essential, High, Medium, Low, Minimal and Not Checked** (David, 2026-11-08), with the values `essential`, `high`, `medium`, `low`, `minimal` and `unchecked`. The values from 1.8.0 still read: `about` as High, `section` as Medium, `mention` as Low and `unread` as Not Checked.
- **Tags on Library entries** (David, 2026-11-08): shown in the box, and members with the group's Hypothesis token add and take them off there. Kept in the group's annotations, so members see them and readers outside the group see only `tags` in `library.json`. `N.itemTags`, `N.setItemTag` in `notes.js`.
- A note added in a Library entry's box no longer stays in the box as a second copy (David's report). The rich editor was left holding the text after the note was saved, until the box was opened again. The same in a finding's reply box.
- **A Key work mark in the Library** (David, 2026-11-07), on the cover, in the list and in the box, for an entry with `key`. Members with the group's Hypothesis token add and take off the mark in the box. It is kept in the group's annotations, so members see it and readers outside the group see only `key` in `library.json`. `N.itemKeys`, `N.setItemKey` in `notes.js`.
- The Library's notes view no longer lists a work that has only a rating or an emoji.

## 1.8.1 (2026-11-07)

- **Key works first in By relevance** (David, 2026-11-07, through ELIZA): an entry with a number in `key` comes ahead of the groups, by that number. Other orders ignore it.

## 1.8.0 (2026-11-07)

- **By relevance in the Library** (David, 2026-11-07, through ELIZA and SHRDLU): a `relevance` field on an entry (`about`, `section`, `mention`, `unread`) gives an order and a filter. Where entries have it, that order comes first and replaces As listed in the menu, and `library.order: 'listed'` shows it. Without the field, nothing changes.
- The S M L buttons no longer show in the Library's list view, where they do nothing.
- **A Preprint badge in the Library** (David, 2026-11-07, through ELIZA), on the cover, in the list and in the box, for an entry with `kind: 'preprint'`. No new field.

## 1.7.0 (2026-11-07)

- `tools/release.js --kit` hands the release to the tool in the kit it has just moved to, so a new step runs on that move (SHRDLU's report on 1.6.0). The old tool still runs on a move to this release itself. The card's description ends at a whole sentence where the first fits in 200 characters.
- **A work's real cover in its Library box** (David, 2026-11-07), from the entry's `thumb`, beside the citation and above it at phone width. A public image used as its own cover already shows in the box and is not repeated, an entry with no `thumb` shows no drawn cover, and a picture that fails to load is removed.

## 1.6.0 (2026-11-07)

- **Share in a Library entry's box** (David, 2026-11-07), with the system's share sheet and the kit's share icon: the entry's title and a link that opens its box.
- **A preview card for the Library** (David, 2026-11-07), such as "Melville Library", one for each bench. `tools/release.js` writes `library/index.html` with its own tags, and that page sends a person on to the entry. Share and Copy link go through it once it is there. `library.card` sets the title, description and image; see `docs/library.md`. Add `library/index.html` to what you commit after a release.

## 1.5.1 (2026-11-07)

- The Library's **Order** menu offers Rating only to a reader with the group's Hypothesis token (the translation session's report on 1.5.0). Without one there are no ratings to sort by. A kept order of Rating falls back to the bench's order, or Author, and stays in the store for when a token is set.

## 1.5.0 (2026-11-07)

- **A Rating filter in the Library** (David, 2026-11-07): three stars, two, one, or Not rated, from the group's average to the nearest star. Shown once a work has a rating. An order or a filter by rating now redraws when the ratings arrive, so a kept order of Rating is right on opening the tab.
- **Language in the Library's filters by name** (David, 2026-11-07), and moved up beside Kind, from below the list of authors. `SW.library.langName` turns `ja` into Japanese with the browser's own names, and leaves a code it has no name for. The record shows the name too, and the search reads it.

## 1.4.0 (2026-11-07)

- The Library's filters no longer vanish on a wide window (the translation session's report on 1.3.0). A page drawn narrow and then widened left an empty column with no way to open them. They now show or fold by the window's width at any moment.
- **Star ratings and emoji in the Library** (David, 2026-11-06, as Paratexts has them), in the panel with its notes, which are the comment box for an entry. Kept in the group's Hypothesis annotations, so a Library entry needs no write to the public repository. The average on the cover, and Rating in the order menu. `N.itemRatings` in `notes.js`.
- **Small, medium and large covers in the Library** (David, 2026-11-06), beside the list, with `library.size` for a bench's first view; a reader's choice is kept.

## 1.3.0 (2026-11-06)

- ＋ Add a work shows only where GitHub says the reader's token can write to the private repository (David, 2026-11-06). Before, any token showed it, including one out of date or read-only.
- **Facets in the Library** (David, 2026-11-06: "the library will start getting big"): filters beside the list by kind, decade, author, language and tag, each value with its count, in place of the Every kind menu. Values in one facet widen, facets narrow one another, and the search and the Held, Linked and Annotated buttons combine with them.

## 1.2.0 (2026-11-06)

- **Notes on Library and Paratexts items** (David, 2026-11-06, for Mark Marino: "so we can record our thoughts on these artefacts"). Annotations in the bench's Hypothesis group: a panel in an item's box, with replies and reactions; a pin to a time, a page or quoted words; a count on covers and cards; an Annotated filter and a ✎ view of all of them in the Library; What's new takes them in. A note stays with an item's code when it moves from Paratexts to the Library. `N.itemPanel`, `N.itemNotes`, `N.itemCounts`, `N.itemGo` in `notes.js`; no new script for a bench to load.
- The Library stretches to the full width of the browser (David, 2026-11-06).
- The Library no longer shows the private repository's size or a warning about it above the list (David, 2026-11-06). Its Help says a copy stays in the repository's history, and `docs/library.md` says how to read the size. `SW.library.size()` is gone.
- The tests ask again for a module that did not load (`T.script`). A test run failed twice in about 25 with "could not load images.js" on a busy machine; the cause is not established.
- More kinds have drawn covers (SHRDLU's request): preprint, conference and proceedings as articles, encyclopedia as a web page, and a newsprint cover of its own for news, newspaper and magazine.
- `docs/library.md` names the citation-only stub (David's rule, through ELIZA): a work with no link and no file keeps its record and citation.

## 1.1.0 (2026-11-06)

- **A linked work plays in the Library's box** (David, 2026-11-06, through Spacewar: "youtube links can be embedded"). YouTube, Vimeo and the Internet Archive, through the function Paratexts used, now `SW.embedPlayer` in `base.js`. Where a file opens, the file comes first and ▶ Play from… opens the player beside it.
- The Library's tooltip and guides say held and linked throughout (David).
- **`tools/library-move.js --adopt`** (Spacewar's request): for entries already in `library.json` by hand, the record goes to `library/moved.json` and the entry stays as written; `--back` restores the record and takes out the entry and its public copies.

## 1.0.0 (2026-11-06)

- **Edit's Beside: Image, Literal, Off** (David, 2026-11-06). Off gives the text alone, at a reading width; the choice is kept (`edit.beside`). The image and the text stay side by side down to phone width. Fixed: switching Beside after scrolling lost the page's image.
- **Book's images button** (David, 2026-11-06): an eye, crossed when the images are hidden, in place of the word Off, which read the same in both states. Images show whenever a page opens, unless a link says otherwise; the last click is no longer remembered (`book.imgon` is no longer read).
- **Further image collections in the Images tab** (David, 2026-11-06, through the translation session: "expandable with additional image file collections"). `images.collections`, each one more part beside Pages and Figures, with its count, its credit on the set and in the box, and links `?tab=images&set=<id>&img=<key>`. A set shows the bench's own copies; a `zoom` copy on another site is asked for with an `<img>` only when the reader zooms past them, and a failure leaves the bench's copy with a small note. `images.js`'s zooming box takes `deep` for this.
- **The picker no longer flashes on a reload** (David, 2026-11-06, through the translation session). `bench.css` hides `.pick` until `shell.js` marks the bar `.with-pick`, for a bench with `picker: true`, so a bench without it never paints it.
- The test of a thumbnail that will not load no longer depends on the browser asking for a lazy image (Melville's report: it failed in the browser pane).
- **`tools/library-move.js`: paratexts into the Library, and back** (David, 2026-11-06, through Spacewar). A plan proposes each entry; each note has to be set by hand, since a description may hold working remarks; each file and alternate goes on the shelf you set. `--back` restores the whole catalogue record and its files. A public file's history is said to stay. The P-code stays as the id: a code in a link or an annotation opens the entry, and Paratexts lists a related item as in the Library.
- **Transcripts and other forms in the Library** (David, through Spacewar): `alts`, each on its own shelf, opened under the work so a transcript can be read while it plays.
- **A citation in the Library's box, with Copy** (David, through the translation session), in Harvard form from the record, or `citation` as written. New fields in the record and the form: `contributor`, `in`, `publisher`, `pages`, `doi`, and `extent` in the record. Its DOI or web address is a live link.
- A book's cover names its kind where the kind is not simply book: edition, translation, parallel text (the translation session's request).
- The Library's filters and tags say **Held** and **Linked**, for Held here and Links out (David, through the translation session).
- **A DOI is a link** (David, 2026-11-06): the Library's box shows an entry's `doi`, and any DOI in a record's text opens at doi.org.
- **Copy link** (David, 2026-11-06): the button in the Library's and the Images tab's boxes that read Link and copied one. A record with no copy held opens with Open where it is published ↗ as its main button.

## 0.99.0 (2026-11-06)

- Help ▾ now says **Getting set up**, as the guide it opens has since 0.97.0 (SHRDLU's report), and so do the messages that point to it.
- **Genealogy is off unless a bench sets `genealogy: { on: true }`** (David, 2026-11-06: it "needs fine tuning for each bench", and Spacewar is where it works). A bench moving to this version loses Genealogy from Versions ▾ unless it adds `on: true`. Collate is unchanged, and a link to `tab=genealogy` still opens the view, so a tour's stop or a cited link does not break.
- **The Library is a shelf of covers** (David, 2026-11-06: "looks like a library rather than a database list"). Covers are the first view, with a switch to the list. Each is drawn from the entry's kind (a cloth book, a paper article, a chapter, a thesis, a letter, a podcast, a talk, a film, a web page), or shows the new field `thumb`, a path or a link; a public image file is its own cover. The order menu takes author, title, newest or oldest first, kind, language, or as listed. `library.view` and `library.order` set a bench's first view; a reader's choice is kept in the browser. `docs/library.md` has "Covers and order".
- **Help ▸ The Library** (and `?help=library`, and ? on the tab): a guide for its readers. The README now shows the tab with a worked example of a manifest, and lists `thumb`, `view` and `order`, and the settings `readFiles`, `columns` and `marks`, which it had left out.
- **A bench's name stays on one line in the top bar** (David, 2026-11-06, through the translation session). `.brand-name` no longer wraps, and the translation template no longer stacks its two parts.
- **Copies are limited to 40 MB, in the Library and in Paratexts, and GitHub's refusal says so.** Tried on real GitHub on 2026-11-06: its API took 41.5 MB and refused 42 MB, on the contents route and the blob route alike, though both modules said 50 MB. A refused file was reported as "conflict". Both now say the file is too large, and that it can go in through git, up to 100 MB. A 5xx from GitHub in the Library says try again.
- **Members saving to the Library at the same moment.** GitHub answers 409 to a commit made while another is going through, and the Library sent a copy once and a record four times with no wait: on real GitHub, 1 of 2 members adding copies at once failed. A copy and a record are now sent up to six times, with a wait that grows and differs between members, and the message says others were saving. Paratexts is unchanged here.
- **Adding to the Library from the bench** (David, 2026-11-06; Spacewar reports that 4 of its 7 members cannot write to its public repository). A member with a token has ＋ Add a work: a record, with a copy of up to 40 MB or without. A member's token reaches the private repository only, so the entry goes in its `library/additions.json` and the copy beside it. Members see additions at once and can correct or remove them; nobody else sees them. `tools/library-publish.js` lists them and, with `--write`, moves them into the public manifest, without the name of who added them. `tests/library.test.js` covers it against a stand-in for GitHub.
- **`docs/library.md`: the Library's guide for a bench** (David, 2026-11-06, through Spacewar, which also reviewed it). Secondary literature in the Library, evidence in Paratexts (the material from or about the subject that the group studies); a file is public only under a CC licence or if freely distributable; a work the group holds otherwise is on the private shelf with a public record, and a public list may say so; a work not held is a record with a link out. `docs/lessons.md` and `docs/advising.md` say the same, and `docs/lessons.md` adds that a feature reaches a bench with guidance on what it is for, what belongs in it and how to adopt it.
- The Library's own words say work where they said text, for talks, podcasts and documentaries.
- **The Library plays audio and video** (David, 2026-11-06, through Spacewar, whose secondary literature is mostly podcasts, talks and documentaries). An entry's `file` may be `.mp3`, `.m4a`, `.wav`, `.ogg`, `.oga`, `.flac`, `.aac`, `.opus`, `.mp4`, `.webm`, `.mov`, `.m4v` or `.ogv`, on either shelf, with a player in its box. A private file is read whole through GitHub before it plays. `library.js`'s header comment corrected: the manifest is public, so a private entry's shelf and file path are in it.
- **A padlock on Edit** (David, 2026-11-06, through the translation session: "a lock on the edit page that has to be physically unlocked to edit the text (just as a safety check)"). Edit opens locked, on a page load and each time the tab is opened again. While locked the text cannot change by typing, pasting, dropping, undo or redo; it can be read, selected, copied, scrolled and saved. A save leaves the lock as it is.
- **Edit, in Read's place on a translation bench** (David, 2026-11-06: "we don't want the Read mode … it needs to be EDIT", with undo and redo; saves "as change lists"). `vt-edit.js`: the page's image beside the text as the file has it, the other version one switch away; scrolling through the whole text, pages added as the box nears an end and the image following the page in view; undo and redo across pages, kept across reloads; what has changed since the last save marked. A save writes a change list in the method's form, new each time, into `translation.edit.dir` of a folder open in Chrome or Edge, or downloads it (no folder, Safari, Firefox), with a copy kept in the browser. The bench never writes the master: `vt_apply` does, and Edit offers the command. A list not yet applied goes on showing in Edit, is counted as pending in Changes, and is recognised as applied once its OLD has gone. Each entry's OLD occurs once and not at all after it is applied; 400 runs of random edits on Kuki's translation (1,154 entries) went through the real `vt_apply.py` and gave the edited text byte for byte. Limit: only a version's first file can be edited so far. `folder.js`: `writable()`, `locate()`, `write()`. `vt-views.js`: Changes reads the saved lists. `shell.home` names the view a link without a tab opens; `shell.alias { read: 'edit' }` sends links to lines to Edit. The translation template has Edit and no Read. `tests/vt-edit.test.js`: 60 checks. Images, Library and Topics no longer need Read's section to add their own, and `tools/views.js` now opens the kit's views too.
- **The Images tab: Figures first, labels in gold** (David, 2026-11-06). Figures come first where a bench has them (`images.start: 'pages'` for Pages). The added English labels are in kintsugi gold, so that they read as added to the author's figure: one gold in every theme (`#7a5c00`, 6.25:1 on white; measured on Kuki's print files at every size, David's choice over a lighter `#8f6c00`, which rendered at 3.64:1 in small type), since a figure's ground stays white whatever the bench's colours. Export offers the labels in gold or black.
- **`theme.start`**: the theme on a first visit, in place of the bench's own dark one; a reader's choice is kept. The translation template starts on a light theme (Listing paper).
- **The version picker is off unless a bench asks for it** (David, 2026-11-06). The picker in the top bar, with the version's reference and language beside it, is now shown only where a bench sets `picker: true`; it was shown unless a bench set `picker: false`. Versions are chosen from File ▾ ▸ Open a version… (⌘O), or Versions ▾ where a bench has no File ▾. **A bench that wants to keep it adds `picker: true` to `js/config.js` when it moves to this release**; one whose tour points at `#pick-a` otherwise keeps a stop whose words describe a picker that is not there. The site map's sentence follows the setting.
- The kit's README now lists what 0.98.0 added and left out of it: `library.js`, `images.js`, `folder.js`, `vt-reader.js`, `vt-views.js`; the settings `library`, `images`, `folder`, `translation`, `textLang`, `tokenise`, `paratexts.words`, a dictionary's `lang` and `forms`; Book's `doc.beside`, `imageSide`, `imagesFirst`; `tools/iiif-map.js`, `tools/new-bench.js`; the guides and templates.
- **`tools/vt-figures.js`** (David, 2026-11-05: a translation bench gets its figures without code of its own). Reads the method's `figures/figures.csv`, `overlays.json` and the captions after the translation's image lines, and checks them against one another: every image line has a row and every row an image line, file names agree, files exist, the flag agrees with the text (the list's `overlays no` shows no labels whatever the labels file holds; a figure the text marks `{overlays="no"}` must say no; a `no` with labels and no such mark is a mismatch, since the book would draw them), and image and region against the bench's image map where it has one (no IIIF service assumed). If all agree it copies the files and writes `figures/figures.json` and `figures/overlays.json`; if not it lists every mismatch, writes nothing and exits 1. `--check` checks only. `SW.BENCH.translation.figures: { list, overlays }`. `SWVT.figures`, `figureLines`. Tried on Kuki's list (22 figures). `tests/vt.test.js`: 14 more checks.
- CI: the kuki-bench translation bench (vector-humanities/kuki-bench, the first made from `templates/translation/`) added to the benches tested with each push.

## 0.98.1 (2026-11-06)

- **Page images that do not depend on the library** (reported by David on the Kuki bench: the National Diet Library answers 429 and pages break). `images.held: { thumb, full }` (paths with `{key}` or `{key3}`): the Images tab's thumbnails and zooming box come from the bench's own files and nothing is asked of the library; the box zooms on the one full-size file, a figure's region still in its pixels; a plain link to the library's copy stays. For a bench that holds no copies, requests to a library's service go through one queue (`SW.images.makeQueue`): four at a time, what the reader has just asked for first, a failure stopping the queue and the request made again after a wait that grows, then given up; a thumbnail shown only as it comes into view; no broken image left. `tests/images.test.js`: 11 more checks.
- **Closing a figure's box no longer saves a file** (reported by David on the Kuki bench). The box's ✕ and its export buttons shared an attribute (`data-x`), so ✕ also exported the figure as an SVG, and PNG or SVG also closed the box. The export buttons are now `data-exp`. `tests/images.test.js`: 8 checks, on a real box, of what ✕ and each export button do. `images.figures` may give `{ items, labels }` in place of files.

## 0.98.0 (2026-11-05)

- **A figure's labels centred and turned** (David, 2026-11-05, for Kuki's Figure 1). A label in the Images tab's labels file may give `anchor: 'center'` (its centre at x, y) and `angle` (degrees, clockwise, about that point), so that a word set along a diagonal or down beside the drawing has its English the same way; the PNG and SVG exports draw them so. Labels without them are placed as before. `docs/figure-labels.md`: the format, and the rules for placing labels.
- **The readable is the translation** (David, 2026-11-05: "make it everywhere… standardise now"). In `vt-reader.js`, `vt-views.js` and the translation template the two texts are the translation (`translation`, TR) and the literal translation (`literal`, LT); Pages opens on the translation with its image, the literal one switch away. The old name is read as the new wherever it appears: a change list's `### readable | p. 12`, a descriptor's `readable` paths and `versions.readable`. `tests/vt.test.js`: 1 more check.
- **Dictionaries in any language** (for the translation benches; approved by David, 2026-11-05). A dictionary in `SW.BENCH.dictionaries` may give `lang` (en if not): English is looked up as before; any other language as written (NFKC, lower case), and in a script written without spaces (Chinese, Japanese, Thai…) each prefix of the selected run, longest first, so a run finds the longest word it begins with. Shards of a large one go by first character (`u5076.json`). `forms(word)` gives a bench's own forms to try (a deinflector). An entry may carry `reading`, shown after its head; the entry has the dictionary's `lang`. 📕 Look up takes accented words whole and a run of an unspaced script as one (`SW.dict.words`). `tools/dict-build.js jmdict`: JMdict from jmdict-simplified's JSON (CC BY-SA 4.0), with `--lang`. `tests/dictionary.test.js`: 11 more checks.

- **Book's Compare for more than two texts** (for the translation benches: the source's page, the translation and the literal side by side; approved by David, 2026-11-05). Compare takes a text beside the first and then another, up to `SW.BENCH.doc.besideMax` (3), all held at the same page break as any is scrolled; a passage beside a version's states lights its page in every column of states. With three columns or more the page images are beside the first only (a ▣ at each page break in the others opens one). `SW.BENCH.doc.imageSide: 'left'` sets each page's image to the left of its text. The address keeps the texts beside as `bb=a,b` (a single `bb` as before).

- **Open a folder** (`folder.js`; for the translation benches, so a translator reads a working copy, uncommitted work included, with no token; approved by David, 2026-11-05). For a bench that sets `SW.BENCH.folder`: File ▾ ▸ Open a folder… reads the bench's files from a folder on this computer where it holds them (the repository's top, a folder within it or above it, or the bench's own source folder), and fetches the rest as before. In Chrome and Edge each file is read from the disk when wanted, Read the folder again takes the changes made since, and the folder is offered again on the next visit (Reopen); in Safari and Firefox the files are read as they were when chosen. A chip in the tab row names the folder; Close the folder goes back to the published files. `SW.on('folder')` tells a bench's reader the folder's paths, to find its texts in it. `SW.forgetBuilds()` (builds.js) reads every file afresh.

- **Words in any script** (for the translation benches; approved by David, 2026-11-05). `SW.textstats.tokens` takes the bench's own words where it gives `SW.BENCH.tokenise(text, textLang)`, and where a text is in a script written without spaces (Chinese, Japanese, Thai, Lao, Burmese, Khmer) the browser's word breaker (`Intl.Segmenter`, in `SW.BENCH.textLang`, the texts' language, or the language the script suggests; `SW.BENCH.lang` remains the code language that names a `lang-*.js` reader): 九鬼 / 周造 / の / 偶然性, not one run. Spaced texts are read as before, so models and counts already made do not change. `SW.textstats.segment(text, lang)` and `unspaced(text)`. The Topics tab's passages (`SW.topics.tokens`) use them for an unspaced text or a bench with its own tokeniser. `tests/textstats.test.js`: 4 more checks.

- **The Library** (`library.js`; asked for by David, 2026-11-05: texts for wider reading on the project, public, beside the private Paratexts). For a bench that sets `SW.BENCH.library`: a Library tab after Paratexts, listing the entries of `library/library.json` in the bench's own repository (or the bench's own list), with a search and filters (held here, links out, by kind). An entry is held (a PDF, text, Markdown, HTML or an image in `library/files/`) or a record with a link out; it opens in a box over the bench, with its record, the file shown (a PDF in the browser's own viewer), Open in a new tab, Download, the link out and a link to the entry (`?tab=library&lib=<id>`). Where the reader has a paratexts token, the group's private copies of an entry are offered beside it (a paratext whose record names the entry, `library: [id]` or a tag `library:<id>`), and open as a paratext; without one nothing is looked up, and the public list names no private copy.

- **Images from a IIIF manifest** (`tools/iiif-map.js`, lifted from the Melville bench's `tools/leaves.py`; approved by David, 2026-11-05). The tool reads a IIIF manifest (Presentation 2 or 3) and writes the bench's image map (a script and JSON: each image's service, size, label and canvas), keyed by sequence, label or the bench's own list (`--map`: key, image, region, so that a page can be one half of a spread). `--fetch` holds copies in the bench at a width and a size on the long side, with `provenance.csv`, where the holder's terms allow. `SW.iiifImage(x, o)` (base.js) gives Book a page's image from the map, `{ src, large, sharp }`, asking only what a level 1 service answers (a region in pixels, a size by width or height): tried on the National Diet Library's 偶然性の問題 (174 images). `tests/kit.test.js`: 4 more checks.

- **Templates for bench types, and a translation bench** (asked for by David, 2026-11-05: "a template from bench kit that is ideal for vector translation benches"). `templates/` holds the starting state of each kind of bench (`templates/README.md`); `tools/new-bench.js <type> <folder> --name …` makes a bench from one: the template copied, the bench's names and addresses put in, a git repository with the kit as its submodule at a release, and what is left to edit listed, nothing pushed. `templates/translation/`: a bench for a translation made by the vector translation method, with an invented example: Pages (Book with the source's image to the left of the translation, the literal beside it on a switch, held at the page, the image once beside the first text), Glossary, Changes, Search, Read, Collate, the Library, Open a folder. New kit modules for it: `vt-reader.js` (from the translation bench's session: the method's layout read as lines, pages and image markers, sections, notes, Book's document, the glossary from CSV or a Markdown table, change lists in the method's form and the first run's, OCR, old character forms folded; a change of several paragraphs counts as applied when each paragraph is there) and `vt-views.js` (the glossary as a concordance of the translation by section, with renderings shared by two terms marked; the changes by origin and state, each to its place in the text; a source word in the OCR, exact or one character wrong, and in the translations). Book: `doc.beside` (the texts beside the first until the reader chooses), `doc.imagesFirst`. `docs/bench-types.md`, `docs/lessons.md`, `docs/advising.md`: the kinds of bench, what the benches have taught, what to settle before starting one. `tests/vt.test.js`: 18 checks.

- **The private collection's name is the bench's** (asked for by David, through the translation bench: in translation studies a paratext is the translator's preface, notes and glossary, which a translation bench shows in its public text). `SW.BENCH.paratexts.words: { one, many }` names it in the bench's text: the tab's heading, Help ▾, the guides, ⚙ Settings, the joining steps, the messages; `SW.px(k)` (base.js) gives the word. Paratexts if not given. Code benches are unchanged; the translation template leaves Paratexts off, its parallel texts being a kind in the Library (David, 2026-11-05). `tests/kit.test.js`: 2 more checks.

- **The Images tab** (`images.js`; asked for by David, through the Japanese translation and translation bench sessions, with his approval of the figures' design). Off unless a bench sets `SW.BENCH.images`; Graphics ▾ is unchanged. **Pages**: every image of the bench's image map as a thumbnail; one opens in a box that zooms through the library's IIIF tiles (from its `info.json`: the whole image at a ready size, then the tiles in view at the scale the zoom needs). **Figures** (`images.figures: { url, overlays }`): each figure in a box, the print file or the archival original; the English labels drawn over the print file from data (x, y fractions of the image, the label's left or right edge at x, as vector-book sets them), Source only or With English; where the bench says a figure has no labels, the caption's key beside it; On the page (the figure's region of the page image, outlined, in the zooming box); the page in Book; a labelled copy exported as PNG or SVG, made when asked. About the labels, folded under a figure's key: the bench's `images.labelsNote` and the figure's own `labelsNote` (why a word written a character at a time along a line has one label). Links `?tab=images&img=<key>` and `&fig=<id>`. Tried with Kuki's 22 figures and NDL's 174 images. The translation template turns it on.

- **The Library's two shelves** (David, 2026-11-05: "we have a public library, but could have a private library", kept in the one private repository "as a hidden set of resources, perhaps in a /library folder"). An entry with `shelf: 'private'` has its file in the group's private repository (Paratexts' own, or `library.private: { org, repo }`) under `library/`, which Paratexts does not list; everyone sees its record, and a member opens the file in the same box with the token Paratexts uses (fetched through GitHub's API, never stored). Without a token, the record and its link out. A filter, For the group; members see the private repository's size above the list, marked above 800 MB. Kinds (parallel text among them) filter the list as before. `vt-reader.js`: `body.from`, where the author's text begins after the translator's front matter, so the Glossary's concordance counts only the author's text; a glossary note shown in brackets, apart from the renderings. The translation template: the Library with both shelves; Paratexts off (`menusOff`), its words unset.

## 0.97.1 (2026-11-02)

- `tests/topics.test.js`: the check that a Help ▾ group with all its items off goes now turns off whatever the bench has in Annotating and sharing, its own items too. It had failed on the Spacewar bench in CI since 0.93.0: Spacewar adds items there.

## 0.97.0 (2026-11-02)

- **Getting set up** (asked for by David, through the Spacewar bench: newcomers found joining “very very confusing”). Help ▸ Joining the annotation group, now titled Getting set up, takes each service in two steps, joining first and the token second, the second opening once the reader says the first is done:
  - Hypothesis: 1 Join the group (one button to the bench's group, where sign-up and log-in happen too; where the bench sets no group, the invitation link pasted here), 2 Your token (the developer page, initials and token, Save and test). The guide no longer asks for the group where the bench has one.
  - GitHub, where the bench has paratexts: a GitHub account and the organisation's invitation are said to be needed; 1 Accept the invitation (`github.com/orgs/<org>/invitation`), 2 Your token (the prefilled form, and the three settings to check: resource owner the organisation, only the paratexts repository, Contents read and write; a note on approval where the bench sets `paratexts.approval`).
  - Save and test says which step failed and what to do: a Hypothesis token refused (generate it again), a token that works but not in the group (open the group and click Join), connected as whom to which group; a GitHub token refused, or working but unable to reach the repository (the causes in order: the invitation, the resource owner, the repository chosen, approval where it applies), connected with the catalogue's size.
  - **Where you are**: a checklist at the top of the guide and in ⚙ Settings ▸ Annotations, two lines for each service, each with ✓, ✗ or ○ and the next thing to do. `SW.notes.check`, `setupChecklist`, `hypSay`, `ghSay`; `SW.paratexts.diagnose`.
  - GitHub's own messages: a 404 names the causes in order, a 403 says the token can read but not write.
  - The steps to send (Settings, Copy the steps) follow the same order. `tests/kit.test.js`: 5 more checks.
- **The bench's Hypothesis group when none is set** (reported by the Spacewar bench, for David): a group stored empty (Settings saved with the box empty) was kept for good, in place of the bench's `group`. The group is now the one set in this browser, else the bench's (`SW.groupSet()`); an empty box in Settings clears the browser's choice rather than storing an empty one (`SW.setGroup`, `SW.store.remove`). A group chosen in the browser still wins. `tests/kit.test.js`: 3 more checks.

## 0.96.1 (2026-11-02)

- **`SW.book.openAt(vid, { p, n0, n1 }, stage)`** (asked for by David, through the Melville bench: a stage's document in Topics opens in Book at that stage): Book on a version at those lines, selected and flashed, and at a stage of the revision where the version is one of the text's states (0 before revision, n after the nth stage); a step on the way back. Where the bench has no Book, Read at the lines. `tests/book.test.js`: 1 more check.

## 0.96.0 (2026-11-02)

- **Read is a plain tab, and File ▾ ▸ Open a version…** (asked for by David, through the Spacewar bench; since 0.47.0 Read had opened only its menu). One click on Read goes to the version being read, where it was left. Versions are opened from **File ▾ ▸ Open a version…** (⌘O or Ctrl-O; in Versions ▾ where a bench has no File ▾), a box laid out as a chooser in the bench's own style: folders on the left (Recent, then the version picker's groups, or for a bench in layers each layer and its groups), the versions on the right with the columns the bench has (name, date, reference, medium), each opening to its files (by `readFiles` groups where the bench has them); a search over name, date and reference; double-click or Enter opens a version in Read at its kept place, a file at that file, a lost version at its record; the arrow keys move, → and ← open and close a version's files, Esc closes. A choice is a step on the way back. The version picker in the top bar stays. A bench that sets `readMenu: true` keeps Read ▾ (then a click on Read from another view goes back to Read and its ▾ opens the menu). `SW.openVersion()`.
- **Read keeps its place** (asked for by David, through the Spacewar bench): for each version, the line at the top of the view is kept in this browser (the last thirty versions read) and in the address (`&at=p:n`); a version opened again, a reload, and a visit with no version named (which opens the version last read) come back to it. A version chosen in the picker or in Read ▾ is a step on the way back, and ← Back names the place left: the version and the file and line (“← MEL reading text · chapter-1.xml:129”). `SW.readPlace`, `SW.views.read.top(p, n)`; `SW.select(id, keep)` keeps a selection and place given with it.
- **The Topics tab's parts** (the plan's views): 2 Topics (each topic's words, share, coherence and exclusivity), 3 Documents and topics (the mean share by part, a heatmap), 4 A topic through the text (its share of each document in reading order, and the documents that carry most of it, each linked to the text), 5 A word's topics, 6 A document's topics, 7 A selection's topics (a passage inferred on the model in use; **🧩 Topics** on Read's selection bar and in Book's pop-up), 8 Across the stages (each choice of a set inferred on the model, the mean shares, and one topic part by part and stage by stage, a share resting on less than one document's worth of the model's words marked ◌), 9 Steadiness across seeds (the model's check). Each part exports. A bench may give `topics.open(doc)` (its text for a document) and `topics.tokens(text)` (a passage's words as its documents have them).
- **Topics compared by cosine** (asked for by David, through the Melville bench): the seed check and `--compare` take two topics to be the same by the cosine of their word probabilities over both models' words, at a threshold calibrated from the seed check (the lower quartile of the cosines of topics that are each other's best match across seeds), recorded with how it was found; the comparison lists every topic of each model with its best partner, cosine and the top-20 Jaccard beside it; the vocabularies compared are recorded. Jaccard stays in the check beside the cosine, for models made before. `SW.topics.phi`, `cosines`.
- **Help ▸ Topic models**: what a topic model is, the models, reading the topics, across the stages, how far to trust a topic; a ? in the tab opens it. (Asked for by David.)
- `docs/topics-guide.md`: the cosine measure and its calibration, and reading a comparison.
- `tests/topics.test.js`: 5 more checks; `tests/trail.test.js`: 7 more (Read's place, Open a version).

## 0.95.0 (2026-11-02)

- **The topics engine** (`topics.js`, on mallette 0.2.1, which the kit now carries as `mallette.js` and `mallette-worker.js`; 0.2.1 has Java's logarithm, so a model made in a reader's browser and by the tool in node are the same): a bench's documents (`topics.documents(o)`) prepared (stopwords, words shorter than three letters and words seen fewer than the minimum taken out), trained, and written as a model file (`bench-kit-topics`): its settings in full, its documents and their proportions, each topic's words with MALLET's diagnostics (coherence, exclusivity…), the model's data for inference, an id made from the settings and the documents' ids (`M-771c6b`), the source (`topics.source()`: the bench's version and its sources' commits) and the documents' fingerprint. The engine runs in node as in the page.
- **tools/topics.js** (asked for by David: only the chosen model published): the bench's documents from the bench itself in headless Chrome; every setting and seed asked for trained with mallette in node; how far each setting's topics recur across its seeds; the chosen model alone written, with its `check`; `--compare` with another model (each topic's partner, and the topics without one, with the documents that carry them), `--note`. On the Melville bench's reading text, 80 documents: twenty models in 26 seconds; eight topics on words seen twice or more recur most (79%).
- **The Topics tab's Models part**: the bench's models and the reader's own, each with its settings, where it was made from, the check behind it and its first topics; run a model in the page (in a Web Worker, with progress, stopped at will), kept in this browser (IndexedDB), exported and imported; the model in use chosen. A warning where a model's source has changed since it was made, or the bench now cuts or tokenises its documents otherwise (the fingerprint). The same settings in the page as in the tool give the same file.
- **docs/topics-guide.md** (David's direction: each bench builds its own models): what a bench provides and what the kit does; its documents, sets, source and stopwords; building, reading the seed check, choosing, publishing, rebuilding when the text changes, comparing two models; a checklist.
- **tools/mallette-update.js** sets the kit's copy of mallette to a release (`docs/mallette.json` holds the release and each file's SHA-256).
- Views a kit module adds to the tab row (`SW.kitViews`) stay among the shell's views whatever list the bench sets after it (the Topics tab was dropped by a bench that sets its views later).
- The word cloud's control: `set(F)` puts a format in place with no change() and nothing kept, for a lens's state given back on the way back (the Melville bench's request).
- `tests/topics.test.js`: 13 more checks of the engine (prepare, train, the file, ids and fingerprints, the seed check, comparing models, drift); `tests/wordcloud.test.js`: one more.

## 0.94.0 (2026-11-02)

- **Word cloud looks** (asked for by David: good first views without setting anything, and no rows of options taking up the lens). `SW.wordcloud.LOOKS` are formats that go together: Oval (the default, the Melville bench's, which David chose: many colours, Georgia, half the words upright, an oval), Classic (a few upright, a rectangle), Ink on paper, Poster, Typewriter and Heart. `SW.wordcloud.control(o)` puts a Look menu and ⚙ in one line of a lens's toolbar; ⚙ opens a pop-over with the details (colour, hue, font, shape, upright, spacing, sizes, bold, capitals), the bench's own options at its foot (`o.more`), and Back to the look. A detail changed is kept beside the look (`{ look: 'oval', upright: 0.5 }`), and the Look menu marks the look as changed; `brief(F)` gives the look and only the details that differ, for links and saved settings. A bench adds looks of its own and chooses the look a cloud starts with (`wordcloud: { looks, look }`, the Melville bench's request). `format(F)`, `options(F)` and `colour(items, F, o)` turn a format into the cloud's options and its words' colours; a bench's own colouring (`o.colours`, `o.colour`) comes first. Normal spacing is 4 px round each word.
- **Default View, and the view kept** (asked for by David: the cloud's settings kept, with an easy way back). The control keeps the whole view in the browser under the key the bench names: the format and the bench's own part (`view: { defaults, get, set }`: which text, how many words…). **Default View**, in the toolbar's line when the view is not the bench's default, puts back the bench's defaults, the default look and the zoom. `save`, `load`, and `encode` and `decode` for a Share link (`look:oval,upright:1,src:chapters`); a link written before looks, with every detail, reads the same.
- **Zoom and export for the cloud** (asked for by David): `SW.wordcloud.frame()` shows a cloud with − Fit + (50% to 400%, scrolled when larger than its frame) and the kit's ▣ SVG, ▣ PNG and ＋ My notes buttons.
- `tests/run.js` asks for a test script a second time before reporting that it could not be loaded: the headless test server dropped a connection now and then, failing a run with every check passing.
- `tests/wordcloud.test.js`: 30 more checks of the looks, formats, `brief`, colours, the control, a view kept, shared and put back, and the frame's zoom.
- **The way back** (asked for by David: after clicking a word in the word cloud, a way back to the cloud). A jump the reader did not choose from the tab row or a menu (a lens opening another, a word's link to the Words lens, a lens's or a finding's link to lines in Read) is a step in the browser's history. **← Back** in the tab row, named for the place left ("← Word cloud"), and the browser's Back, return to it as it was: the view, the version, the lines, the lens. A trail of jumps (the cloud, a word, a line) goes back one step at a time. `SW.trail` (`from`, `step`, `quietly`, `back`); `SW.setTab` takes a step when the view changes, the tab row and the menus quietly. Addresses rewritten as the reader moves keep their entry's place.
- **A lens's own state** for the way back: `SW.lenses.state(n, get, set)`, given as the lens is drawn; `get()` says what it shows when the reader jumps away, and `set(s)` shows it again on the way back (the Melville bench's request).
- `tests/trail.test.js`: 5 checks.

## 0.93.0 (2026-11-02)

- **Menus and tabs a bench turns off** (`menusOff`, asked for by David): a name alone leaves that menu or tab out of the tab row (`'file'`, `'paratexts'`, `'topics'`), and `'menu:pick'` leaves out one item (`'help:sitemap'`, `'file:backup'`, `'text:6'` for lens 6 in Text ▾). A submenu, lens group or heading left empty goes too. It covers File ▾, Read ▾, Versions ▾, Help ▾, the lens menus, Graphics ▾ and a bench's own menus. A view left out of the tab row still opens from a link to it. `fileMenu: false` still works. `SW.menuOff(which, pick)` says whether one is off.
- **The Topics tab** (`topics.js`, `SW.topics`; asked for by David as a tab of its own, the first step of topic modelling in the kit on mallette): a bench that sets `topics` has the tab, which the kit adds to the tab row and the page where the bench has not. Its first part, Models, lists the models the bench publishes (`topics.models`), each read from its model file with its id, engine, settings and documents. The topics and their views, and models run in the page, come with the kit's topics engine.
- `tests/topics.test.js`: 17 checks of the menu switches (Help ▾ and a pruned menu) and of a model file's settings.
- **Word cloud shapes** (asked for by David): a cloud may be a rectangle, square, oval, circle, diamond, hexagon, triangle or heart. `SW.wordcloud.SHAPES` lists them, `{ id: [name, inside(x, y, W, H)] }`, in that order, so a lens can build its shape menu from it and show new shapes without a change of its own (the Melville bench's request). The ids `rect`, `oval` and `round` stay as they were, for settings readers have saved; `circle` is taken for `round`, and a shape not known is the rectangle. Words are sized to the shape's share of the frame, as before for the oval and circle.
- `tests/wordcloud.test.js`: 12 more checks (the list and its names; for each shape, words inside it and apart; `circle`; a shape not known).

## 0.92.1 (2026-11-02)

- `tests/wordcloud.test.js`: the layout checks give each letter a fixed width, so they no longer depend on the fonts of the machine they run on. On GitHub's Linux runner, without Georgia, one check failed in 0.92.0 (a word that fitted there at its full size).

## 0.92.0 (2026-11-02)

- **Word clouds** (`wordcloud.js`, `SW.wordcloud`, asked for by David so that every bench has one, and for the Melville bench's Word cloud lens, whose own `js/cloud.js` it replaces). The layout is ported from Andreas Mueller's word_cloud 1.9.6 (MIT; notice in `docs/wordcloud-LICENSE.txt`):
  - Words are placed largest first, each at a place chosen at random among every place where its box touches no ink already drawn, found through an integral image of the ink. In a page the ink is the letters' own shapes, so small words sit in the gaps of large ones; `layout: 'spiral'` places each word as near the middle as it fits instead.
  - A word that does not fit at its size is set at the largest smaller size that fits, in either orientation; one that fits at no size is listed in `dropped`.
  - Sizes by the square root of the count (default), its log, the count, or word_cloud's relative scaling (`contrast: 'relative'`, `relativeScaling`). `scale` pins the count given the largest size, so sizes compare across steps.
  - `upright` (the share of words set upright), `shape` (`rect`, `oval`, `round`), `mask`, `margin`, `caps`, `weight`, `font` and the `FONTS` a lens may offer; each item's `fill` (a theme token or a colour), `alpha` and `title`.
  - The cloud is SVG coloured by the theme's tokens, with each word a `<text data-w>` for a lens to make clickable, ready for `SW.exportSVG`. Its styles are in `kit.css` (`.wc-cloud`), which keeps the figure's own font where `bench.css` sets SVG text in mono.
  - A layout can be kept: `places` from an earlier cloud draws each word at its place, no larger than it was, and leaves out words without one (`faint` draws a placed word with no count faintly). This is Melville's way of stepping through chapters and stages with the words held still, and its `cloud(items, o)` calls work unchanged.
  - `tests/wordcloud.test.js`: 32 checks (words apart and inside the frame, the same cloud for a seed, words that do not fit, upright words, the oval, a mask, a kept layout, the SVG).
- **Text statistics** (`textstats.js`, `SW.textstats`), lifted from the Melville bench, where it was written for its distant-reading lenses after Underwood (David's request):
  - **The engine**, which needs no page: tokens and counts; Dunning's G² and keyness between two texts; Mann–Whitney ρ over chunks, as in Underwood's note on Dunning's; Burrows's Delta and the nearest text; PCA; L2-regularised logistic regression with cross-validated probabilities; MATTR, Heaps, Zipf, Yule's K, hapaxes and sentence lengths; collocates by G² and PMI; a seeded generator. English stopwords with archaic forms, which a bench can replace (`textstats.stopwords`).
  - **The figures**, in SVG on the theme's tokens: lines, scatter, dispersion, a shaded table, a stepper through states, and an export block. Their styles are in kit.css.
  - Topic modelling and the word cloud are not in it: the word cloud is `wordcloud.js`, and topic modelling is to come as a module of its own on MALLET's LDA.
  - `tests/textstats.test.js`: 27 checks worked by hand.
- Dictionaries: a word in -men is looked for in -man (landsmen → landsman, Englishmen → Englishman), as the Melville bench found it was not.

## 0.91.0 (2026-11-02)

- **Dictionaries** (`dictionary.js`, asked for by David, for the Melville bench's rare words and any bench's): a bench names its dictionaries (`dictionaries`) and a list of word frequencies (`wordFreq`).
  - **📕 Look up** on words selected in Read's selection bar and Book's selection pop-up shows each word's entries in every dictionary, each with its source's credit: head, part of speech, field labels (Naut., Law…), senses and a short etymology. The word's Zipf frequency is shown beside it.
  - A word not found as written is tried in simple English lemmas, modern and archaic (sallies → sally, stopped → stop, walketh → walk), and the form found is named.
  - A dictionary is one file, or shards fetched as needed for a large one. Webster's 1913 whole is 101,367 headwords in 330 shards (26 MB); the 8,120 words of Melville's texts need 5,841 of them in one 3.9 MB file.
  - `SW.dict.lookupMany(words)`, then `lookupNow(word)`, serve a lens checking thousands of words; `SW.dict.zipf(word)` gives a word's frequency.
  - Settings ▸ Dictionaries turns each dictionary off or on.
  - `tools/dict-build.js` makes the files from Project Gutenberg's text of Webster's 1913 (ebook 29765, public domain in the United States; only the definitions are taken) or from a JSON list, optionally only the entries a list of words needs.
  - `tests/dictionary.test.js`: 18 checks of the lemmas, shards and finding.
- File ▾ and Help: **Back up my data** and **Restore my data (non-destructive)**, with no line under them (asked for by David). A menu item given no description shows none.

## 0.90.3 (2026-11-02)

- **A− and A+ size Book's text** (reported by David, through the Melville bench, where they changed nothing in Book): while Book is open they set Book's own size (18 px unless set, 12 to 32; 2 px less on a narrow screen), with its heads, margins and note pop-ups in proportion; elsewhere they set the text's size as before. Kept in the browser (`book.size`).

## 0.90.2 (2026-10-31)

- Book's enlarged page closes only with ✕, a click outside it, or Esc (asked for by David): a click in its details (the image credit's chevron, the text) or on the image no longer closes it.

## 0.90.1 (2026-10-31)

- `doc.imageCreditShort` (plain text): the line the folded image credit shows in Book's enlarged page, in full, in place of the credit's first words (asked for by David, through the Melville bench, whose permission asks for the call number with each image: "Houghton Library, Harvard University, MS Am 188 (363)").

## 0.90.0 (2026-10-31)

- **Book: bookmarks** (asked for by David): a red bookmark at a page's top right, beside the text and in the enlarged page (where it keeps its size as the page zooms). Faint on the page under the pointer until set; a click on it, the 🔖 button in the enlarged page's details, or b there sets or takes it off. **🔖 Bookmarks** in Book's toolbar lists the text's bookmarked pages, in order, and goes to one. Kept in this browser (`book.marks`), the same page in every text, saved by Back up my data.
- Book's enlarged page, its details (asked for by David): the rating, the bookmark and Copy link on one line; the image's credit folded behind its first words (▶ Houghton Library); "Lines are estimated." for the estimate note; the keys in small type; the details scroll within the dialog rather than pushing the page out of view.

## 0.89.0 (2026-10-31)

- **Book: a page rated out of three stars** in the enlarged page's details (asked for by David), as Paratexts' items and the findings are: one rating to each reader, signed with their initials, the same star again to take it back, the group's average and who gave what beside it. A rating is a reaction (★1 to ★3) answering no annotation and tagged `page:<facs>`, so it is shared with the group's annotations, or kept as a draft in this browser without a group, and counted in no annotation list; What's new says "rated img_13 ★2".

## 0.88.0 (2026-10-30)

- **Settings ▸ Book: the pages' edges** (asked for by David, through the Melville bench): what is not the page, such as a scan's colour card and ruler, trimmed from every page's image, beside the text and in the enlarged page, the boxes and line bands keeping their places on the writing. Dragged on one of the text's pages in Settings, or typed as a percentage of each side; **The bench's trim** goes back to the bench's (`doc.trim: { l, t, r, b }`, each a share of the page, or a function `(pb)` giving each page its own: Melville's card is on the right of most leaves and on the left of 18), and **None** shows the whole scan. The reader's own trim is the same for every page. Kept in the browser; a reader who has not set one follows the bench's.
- **Book's enlarged page takes the page's shape**: the dialog is as wide as the page fitted to the window's height, with its details beside it, so the image no longer sits between grey bands (asked for by David).
- **Book's enlarged page: the details wrap within their column**, where a long reference or label ran past its edge and was cut off (reported by the Melville bench). The column is up to 340 pixels wide.

## 0.87.0 (2026-10-30)

- **Book's enlarged page zooms as Paratexts' pictures do** (asked for by David, through the Melville bench): a trackpad's pinch (the wheel with ctrl) zooms at Paratexts' rate, where it barely moved before; a double-click zooms in at the pointer; the bar has − , the size shown (of the image file), ＋, Fit and 1:1; from half to forty times the fitted size; the page moves freely at any size, drawn at most once a frame. The revisions' boxes and the line bands move with it and stay clickable (a drag or a pinch is not a click), ◀ ▶ and a click beside the image are as before, and share links (`zm`) keep their form, so old links open at their place.
- **A sharper image in the enlarged page**: where `doc.image(pb)` gives `sharp` as well as `src` and `large`, it is fetched as the page opens and put in when it arrives, if the page is still open (the pages either side are fetched too); a failure leaves the image shown. Melville gives Harvard's IIIF image at full size.
- **Book: a revision's box larger than a line lies beneath the line bands** (asked for by David, through the Melville bench): one taller than twice the bands' usual height, or 7% of the page (a passage added whole, a paste-on), is reached where no band covers it and from the text, and a line-sized box stays above the bands.

## 0.86.0 (2026-10-30)

- **Book: every line of a page can be selected** (asked for by David, through the Melville bench): where a page break gives the page's lines (`pb.lines: [{ n, box, measured }]`, in the page's own pixels, `n` the line number its spans carry), each line has a band on the image, under the revisions' boxes, beside the text and in the enlarged page. Under the pointer a band lights its line in the text (in the enlarged page, its words and number by the pointer); a click highlights it in the panel, as a box does, or says where the line is not in the text at the stage. A band whose place is estimated (`measured: false`) has a dashed edge, and the enlarged page's details say the places are estimated. On the Melville bench, 5,506 bands on its 396 leaves.
- **Book: an archive's folio and sequence** (`pb.folio`, `pb.seq`) beside the page's name in the enlarged page's details, as "img_7 (folio 2, seq. 7)"; `SW.BENCH.doc.folioWord` names the folio ("Houghton folio").
- `tools/kit-release.js` sets CITATION.cff's `version` and `date-released` at each release, so the citation Zenodo reads from the GitHub Release matches it.

## 0.85.2 (2026-10-29)

- File ▾ and Help: **Back up my data** in place of Back up everything (it saves only what is the reader's own: My notes, drafts, settings and a copy of the group's annotations, nothing on GitHub), and **Restore my data…** in place of Restore from a backup…, its line saying it is non-destructive (it adds notes and drafts beside those here, and settings only where none is set; it replaces nothing). The About box, Settings ▸ Bench and the kit's site name them so (asked for by David).

## 0.85.1 (2026-10-29)

- **Add a version from files fills itself in** (asked for by David, through CCSbench): the id, label and date are made from the files given, into the boxes left empty (or filled this way before); a value typed stays. One file gives its name without the extension; a folder dropped gives the folder's name, its files kept in their folders below it; several files give what their names share, or the first program's name. A year in the name goes to the date and out of the id: ELIZA-1965b.mad gives id eliza, label ELIZA-1965b, date 1965. An id already taken gets -2, -3. `SW.builderSuggest(names, folder)`.
- Tests: the kit's annotation tests make their bench link from the bench's first version held where the bench gives none (`BENCH_TESTS.link`), so a new bench made from the template need not rewrite its test file; `tests/builder.test.js`, 6 checks of what is filled in.

## 0.85.0 (2026-10-29)

- **File ▾**, before Read in the tab row (asked for by David): what acts on the project as a whole, apart from reading it. Add a version from files, Open a project or .ccs file, Save the project to a file and Open a sample where `builder.js` and `projectfile.js` are loaded (moved from Versions ▾); the bench's own items (`menus.file`: `[[pick, label, text]]`, handled by `menus.pick('file', p)`), such as exports of every version; Back up everything and Restore from a backup (also in Help). `fileMenu: false` leaves it out, and the builder's items go back to Versions ▾. The list of a version's files stays in Read ▾, grouped by folder.
- Samples opened from CCS Workbench are listed in a group of their own in the version picker and Read ▾, "Samples (CCS Workbench)", apart from the bench's own versions (`SW.versionGroups`, `SW.inGroup`).

## 0.84.4 (2026-10-29)

- The About box: on a dark theme the Zenodo badge is shown at half strength and less saturated, so its colours do not outshine the box; it comes up to full on hover (asked for by David).

## 0.84.3 (2026-10-29)

- **The kit places a bench's DOI badge** (asked for by David), from `about.doi` alone: in the About box's DOI row (Zenodo's badge for the DOI, unless `about.doiBadge` gives the repository's), and, at each `tools/release.js`, as one line at the foot of the README, any other Zenodo badge in it taken out. **Without a DOI**, the About box's DOI row says so, with a link to set one up on Zenodo (zenodo.org ▸ Account ▸ GitHub), and `tools/release.js` says the same.
- README: "A bench's DOI" now leaves the badge to the kit.

## 0.84.2 (2026-10-29)

- The About box: `about.doiBadge`, Zenodo's badge for the bench's repository (`https://zenodo.org/badge/<GitHub repository id>.svg`, which always shows the latest release's DOI), shown in the DOI row and linked to the DOI (asked for by David).
- README: the kit's Zenodo badge at the foot.

## 0.84.1 (2026-10-28)

- **A bench's DOI in the About box** (asked for by David, through the Melville bench): `about.doi`, the DOI of every version (Zenodo's concept DOI), gives a DOI row after Code, linked to doi.org, and the citation ends "Zenodo. Available at: https://doi.org/<doi>" in place of the bench's address; `about.doiVersion`, this release's own DOI, is shown in the row beside it. A bench without them is unchanged.
- Tests: `tests/about.test.js`, 2 checks of the citation with and without a DOI.

## 0.84.0 (2026-10-27)

- **Annotation types** (Stage 3 of the hand-built project, its first part; asked for by David): where a bench gives `annotationTypes` (`true` for CCS Workbench's six, Observation, Question, Metaphor, Pattern, Context and Critique, or its own list `[[id, label, what for]]`), the annotation box has a Type menu, and the annotation is kept with the tag `type:<id>` and shown with its type above its text, coloured by type. A CCS Workbench session's annotations now come in as `type:<id>` (0.83.0 tagged them `ccs:<id>`, which is still read as their type). A bench that gives no types is unchanged.
- **Read's file menu in folders**: where a version's files are in more than one folder (a CCS Workbench project, a version made from many files), the menu groups them by folder. The Spacewar! sample's 26 files fall into four.
- **Beside, in Read** (asked for by David): another file of the version read beside the one chosen, each with a scroll of its own, as ELIZA-1965b.mad beside the DOCTOR script; ⇄ Swap and ✕ Close in its heading. Offered where a version has more than one file and one is chosen; `beside: false` leaves it out.
- **Repairs to versions made here** (`mending.js`, new; asked for by David, editing as Kintsugi records only): a selection in Read ▸ ◆ Repair shows the lines as held beside a box for how they are to be read, with the mend (Corrected, Supplied, Remade, as the SHRDLU and Spacewar! benches name them), a title, why and the evidence; a repair the same as the held text, without a reason, or over lines another covers is refused. The record is signed and dated, the held file never changed. Read underlines the repaired lines in gold, their reading on hover, with the ◆ stepper and the repairs bar (Why, Take out). **Flatten** on the bar makes a new version, derived from the held one (its record names the version and the repairs), whose files have the repairs applied, for running or handing on; tried on the IPL-V sample, Collate between the two shows the one line changed. Repairs are saved in the project file, and go with a version taken out.
- Read takes the repairs of `mending.js` where the bench gives none of its own, and its selection bar the ◆ Repair action.
- Tests: `tests/types.test.js`, 2 checks of an annotation's type and its name; `tests/mending.test.js`, 10 checks of repairs applied and refused.

## 0.83.0 (2026-10-27)

- **A project as a file, and CCS Workbench's sessions** (`projectfile.js`, new; Stage 2 of the hand-built project, asked for by David), in a bench that says `editable: true` and loads `kit/builder.js` and `kit/projectfile.js`. Versions ▾ gains:
  - **Save the project to a file**: one JSON file with the versions made in the page and their files, the bench's settings and their log, the annotations kept as drafts and My notes, never the tokens.
  - **Open a project or .ccs file**: the same file opened again, here or in another browser, adding to what is here; a version already here is left out and named, the bench's settings come in only where none is set (so a locked GitHub location is not changed by a file), and drafts and notes already here are kept. Saved, cleared and opened again, a project with two samples came back the same, versions, files and 41 drafts; opened a second time it added nothing.
  - A **CCS Workbench session** (`.ccs`) opens as one version: its files in their folders (a README or markdown as documentation), its line annotations as drafts on their lines, typed with a tag (`ccs:observation`, `ccs:question`, `ccs:metaphor`, `ccs:pattern`, `ccs:context`, `ccs:critique`) and their replies under them, signed as in the session, or CCS where it names no one. Its conversation with an AI is not brought in, and the report says how many messages it had.
  - **Open a sample**, where the bench sets `samples`: CCS Workbench Classic's sixteen samples, listed from its Samples.md and read from its public repository at the tag `pre-bench-kit`; the kit copies none of them. ELIZA (Annotated) opens with its 30 annotations on their lines of ELIZA-1965b.mad.
- Tests: `tests/projectfile.test.js`, 3 checks of the samples' list, a session's id and a file's role.

## 0.82.0 (2026-10-27)

- **Versions made from files** (`builder.js`, new; Stage 1 of the hand-built project, asked for by David): in a bench that says `editable: true` and loads `kit/builder.js`, Versions ▾ ▸ Add a version from files takes an id, label, date, authors, a summary, the version it was made from, and files chosen or dropped, each with its role (program, support, doc, text). The files are kept in the browser's IndexedDB as they are, the record in its storage, and the version is listed and read as the bench's own: Read, Collate, Genealogy, references and links (`?v=`) all reach it, after a reload too. A line of descent whose tip is the version's parent runs on to it, or the version names a line, made where there is none. Made here, in the same box, lists them with Take out. bench-template's two versions, made again by hand from the same files, give the same Read, the same Collate in both modes and the same Genealogy flow (path for path) as the bench's own.
- `versionlist.js`: `api.add(v, { parent, witness, also, influence, line, lineLabel })` and `api.remove(id)`, the lines of descent following.
- `builds.js`: a file the page holds itself is read from `SW.fileSource` (`{ has, text, bytes }`) instead of fetched.
- `shell.js`: `SW.fillPicker()`, to fill the version picker again. `menus.js`: Versions ▾ has Add a version from files where `builder.js` is loaded.
- Tests: `tests/versions.test.js`, 6 checks of adding and taking out versions and their lines.

## 0.81.0 (2026-10-27)

- **Settings ▸ Bench** (`project.js`, new; Stage 0 of the hand-built project, asked for by David): for a project its user configures (`editable: true` in `config.js`), the name, title, the About box's project and citation, the references' prefix and short names, and the language's comment marks, routine pattern and case are set in the page. They are laid over `config.js` as the page loads, so the rest of the kit reads them as it reads `config.js`, kept in the browser (`bench.settings`, in Back up everything), and applied by a reload when saved; a value set back to the default is dropped. **The GitHub locations are locked** once set (the repository, the published address, the paratext archive's owner and repository): changing one takes Unlock, with a warning that references, permalinks and annotations may stop resolving and nothing on GitHub moves, and then the new value typed again before Save, which also asks for initials. Each change is logged with the date, initials and old value, and Put back offers the old value again through the same two steps. The storage prefix and the stem of file names are not offered. A bench without `editable` is unchanged: no Bench tab, nothing laid over its settings, for its readers or anyone.
- Settings: a module can add a tab (`SW.settings.addTab`) and a check that stops Save (`check()` on a row); a remembered tab that is no longer there opens You.
- Tests: `tests/project.test.js`, 14 checks of paths, the settings laid over `config.js`, fields shown and read back, and the lock.

## 0.80.1 (2026-10-27)

- `tools/views.js` (new): opens every view of a bench in headless Chrome and reports any that throws, draws nothing or shows that it could not load; `--kit <folder>` serves a kit from another folder in place of the bench's own, so a kit change is checked in a bench with nothing in the bench changed. It reads only the kit's own messages, never the text being read ("he could not read" in *Billy Budd*). The kit's workflow now runs it after the tests in each bench, and covers the Melville bench (kit at `kit/`, the bench at the repo root). The check that existing benches still work, at each release towards 1.0 (asked for by David).

## 0.80.0 (2026-10-27)

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
