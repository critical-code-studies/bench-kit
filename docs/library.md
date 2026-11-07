# The Library: a guide for a bench

The Library tab (`library.js`) shows the secondary literature on a project as covers on a shelf: books, articles, chapters, talks, podcasts and documentaries. A reader can switch to a list, and order either by author, title, date, kind or language, or as the manifest lists them. Each entry opens in a box over the bench, with its record, the file where one is held, and a link to where the work is published.

## What belongs where

- **Paratexts:** evidence, the material from or about the subject that the group studies. How a subject has been told is evidence where the group studies that. It stays private and reads with a member's token.
- **The Library:** secondary literature, the work on the subject that the group reads and cites.

Where a work could be either, the person running the bench decides. Whether a work may be public is also that person's decision: a session on a bench asks and does not settle it from its own reading of a licence.

## The three kinds of entry

| The work | The entry | What a reader without a token sees |
|---|---|---|
| Under a CC licence, or freely distributable | `file` in the bench's `library/files/`, `licence` saying which | The file |
| Held by the group, and neither of those | `shelf: 'private'`, `file` under `library/` in the private repository | The record, a line saying the group keeps a copy, and the link if there is a `url` |
| Not held | no `file` | The record, and the link if there is a `url` |

`url`, where the work is published, is optional on all three. An entry needs only `id` and `title`.

A work with no link and no file is a stub: its record and its citation, tagged **Record only**. A published work the group holds only in its private archive can be listed this way, without its paratext code or archive details.

A member with a token opens a private file in the same box. The manifest is public, so a private entry's record, shelf and file path can be read by anyone, and the list shows that the group holds the work. File names on the private shelf are public for that reason.

## Two folders called library

- **The bench's `library/`** sits beside its `index.html`: `library/` where the page is at the top of the repository, `research/library/` where the page is in `research/`. It holds `library.json` and `files/`. Paths in the manifest are from the page, so they are `library/files/…` in both cases.
- **The private repository's `library/`** is at the top of the repository that Paratexts keeps. A private entry's `file` is a path from there, `library/…`. Paratexts does not list that folder.

## Adopting it

1. In `js/config.js`, set `library: true`. The private shelf uses the repository in `paratexts`, or `library: { private: { org, repo } }`.
2. In `index.html`, load `kit/library.js` after `kit/paratexts.js` (where the bench has it) and `kit/md.js`, and before `kit/shell.js`.
3. Write the manifest, `library.json` in the bench's `library/`:

```json
{
  "title": "Library",
  "items": [
    { "id": "L-001", "title": "An open article", "author": "A. Author", "date": "2020", "kind": "article",
      "licence": "CC BY 4.0", "file": "library/files/open-article.pdf", "url": "https://example.org/article" },
    { "id": "L-002", "title": "A recorded talk", "author": "B. Speaker", "date": "2019", "kind": "talk",
      "shelf": "private", "file": "library/recorded-talk.m4a", "url": "https://example.org/talk" },
    { "id": "L-003", "title": "A book", "author": "C. Writer", "date": "2001", "kind": "book",
      "url": "https://example.org/book" }
  ]
}
```

4. Put public files in the bench's `library/files/`, and private files in the private repository's `library/`.
5. Run the tests and every view, make the site map again where the bench has one, and release the bench as usual (`tools/release.js`). Where the page is in `research/`:

```bash
node research/kit/tools/test.js
```

```bash
node research/kit/tools/views.js --kit research/kit
```

```bash
node research/kit/tools/sitemap.js
```

Where the page is at the top of the repository, the same tools run as `node kit/tools/test.js --dir .`, `node kit/tools/views.js --kit kit --dir .` and `node kit/tools/sitemap.js --dir .`.

## Covers and order

A cover is drawn from the entry's `kind`: book, thesis, article, chapter, letter, news, podcast, talk, documentary or web page, with near synonyms such as monograph, essay, preprint, conference, magazine, lecture, film or encyclopedia. Where `kind` names none of these, the file's type decides, and otherwise a plain cover is drawn. Each book takes one cloth colour from its `id`, so a book keeps its colour between visits.

`thumb` gives an entry a picture for its cover, a path from the page or a link:

```json
{ "id": "L-004", "title": "A book with a jacket", "kind": "book", "thumb": "library/thumbs/L-004.jpg" }
```

Put a bench's own images in `library/thumbs/`, at about 260 by 390 pixels. A public image file is its own cover without a `thumb`. A picture that will not load leaves the drawn cover. The kit makes no thumbnails from PDFs or videos. Everything in `library/thumbs/` is public, so the person running the bench decides whether a cover or a first page may be shown, as for a file. A link in `thumb` makes each reader's browser ask that site for the picture. ＋ Add a work takes a cover image as a link; the image for a member's addition cannot go in the bench's own repository, since a member's token reaches only the private one.

Author order files under the first author's surname: the part before the comma in `Ōtsuka, Hisao`, and otherwise the last word, so write a name whose surname comes first with the comma. Date order reads the first four-figure year in `date`. Entries with no value for the order chosen go last.

`library: { view: 'list', order: 'new', size: 's' }` in `js/config.js` sets what a reader sees first: `view` is `icons` or `list`, `order` is `author`, `title`, `new`, `old`, `kind`, `lang` or `listed`, and `size`, of the covers, is `s`, `m` or `l`. The default is medium covers by author. A reader's own choice is kept in that browser.

`README.md` lists an entry's fields. An `id` does not change once published, since links (`?tab=library&lib=<id>`) point at it.

## Terms

The tab calls an entry **Held** where the bench holds its file, **For the group** where the private repository does, and **Linked** where it is only at its `url`.

## Playing a link

A `url` on YouTube (through youtube-nocookie.com, with any `t=` as its start), Vimeo or the Internet Archive plays in the entry's box. Where the reader cannot open a file, the player shows at once. Where a file opens, the file comes first and **▶ Play from…** opens the player below it, and a held recording pauses. The player loads only when it is shown, and it is that site's own: it asks that site for the work, and shows that site's error if the uploader has turned embedding off, with the link still above it.

## Files and size

A box shows PDF, text, Markdown, HTML, images, audio and video; any other file can be downloaded. A private file is read whole through GitHub before it opens, and GitHub holds no file over 100 MB. GitHub Pages limits a published site to 1 GB, so check the size of `library/files/` before pushing.

The bench does not show the private repository's size to its readers; the person running the bench can read it with `gh api repos/<org>/<repo> -q .size`, in KB. The figure is GitHub's and can lag: in a trial on 2026-11-06 it read 0 for a repository that had taken about 1 GB in the half-hour before. Moving or deleting a file within the repository does not reduce that size, since the history keeps the file. Reducing it means rewriting the history or starting a new repository, which is a decision for the person running the bench.

## Adding from the bench

A member whose token can write to the private repository has **＋ Add a work** on the Library tab; the bench asks GitHub, and shows nobody else the button: a record, with a copy of the work or without. A member's token reaches the private repository only, so the entry goes in `library/additions.json` there, and a copy beside it as `library/<id>.<ext>`. Members see additions in the list at once, marked as not yet public, and can correct or remove them. Nobody else sees them. The token needs Contents read and write, as Paratexts asks. A copy added from the bench is limited to 40 MB, since GitHub's API took 41.5 MB and refused 42 MB in a trial on 2026-11-06; a larger one goes in through git, up to GitHub's 100 MB. GitHub also answered 502 to one of 31 uploads near 40 MB in that trial, and left nothing behind; the member is told to try again. Five members saving at the same moment all got through; of ten, three were told to try again and nothing was lost.

The person running the bench publishes additions to the public list, from a clone of the private repository:

```bash
node research/kit/tools/library-publish.js ../my-paratexts
```

That lists what is waiting and changes nothing. With `--write` it moves the entries into the bench's `library.json`, takes them out of `additions.json` and removes the name of who added them; `--only L-ABC12,L-DEF34` takes some and leaves the rest. It commits nothing: commit and push each repository. An entry published with a copy stays on the private shelf, with the record and file path public. To make the file itself public, once its licence allows it, move it to the bench's `library/files/` and change its `file` and `shelf` in `library.json`.

## A copy kept as a paratext

An item that stays in Paratexts can name a Library entry, with `library: [id]` in its record or a tag `library:<id>`. A member then sees it in that entry's box. The public manifest does not name the paratext.

## Moving items out of Paratexts

`tools/library-move.js` moves catalogue items into the Library and back. It works on a clone of the private repository and the bench's folder, and commits nothing. Run it from the bench's repository.

1. Make a plan, which writes the entry each item would become:

```bash
node research/kit/tools/library-move.js ../my-paratexts --plan P-AAAAA,P-BBBBB --out plan.json
```

2. Correct `plan.json`. Each `note` starts as `null` and has to be set, a string or `""`, because a catalogue's description may hold the group's working remarks; the description is beside it as `_description` and is not copied. Each `shelf`, on the entry and on each of its `alts`, starts as `private`; set `public` for a file the person running the bench has decided may be public. `url` starts as the first web address in the record. Files named in a description are listed as `_namedInDescription` and stay where they are, unless you add them to `alts`.

3. See what it would do, then do it:

```bash
node research/kit/tools/library-move.js ../my-paratexts --apply plan.json
```

```bash
node research/kit/tools/library-move.js ../my-paratexts --apply plan.json --write
```

4. Commit and push the bench and the private repository.

The Library's `id` is the item's P-code, so links and citations to the code still work: `?code=P-AAAAA` and a code in an annotation open the entry in the Library, and a paratext related to it lists it as in the Library. The `Type` of the record becomes `kind`, its creator `author`, its contributors the one line `contributor`.

`library/moved.json` in the private repository keeps each whole catalogue record, including the fields the Library does not use, its comments and its collections. To move items back:

```bash
node research/kit/tools/library-move.js ../my-paratexts --back P-AAAAA,P-BBBBB --write
```

That restores the record at its old place, and its files, and takes the entry out of `library.json`. Changes made to the entry since it moved are not carried back, and the tool says when there are any. A file on the public shelf, once pushed, stays in the public repository's history: moving it back does not remove it from there, and the tool says so when it moves a file to the public shelf or back.

Moving does not reduce the size of the private repository (see Files and size).

An entry already in `library.json`, put there by hand, is taken over with `--adopt`:

```bash
node research/kit/tools/library-move.js ../my-paratexts --adopt P-AAAAA,P-BBBBB --write
```

The entry and its note stay as written. The record goes from `catalogue.json` into `library/moved.json`, and its files stay where they are in the private repository, for `--back`. `--back` then restores the record and takes out the entry and any public copies the entry named.

## Relevance

`relevance` on an entry says how far it concerns the bench's subject: `essential`, `high`, `medium`, `low`, `minimal` or `unchecked`, shown as Essential, High, Medium, Low, Minimal and Not Checked. The values from 1.8.0 still read: `about` as High, `section` as Medium, `mention` as Low and `unread` as Not Checked.

A member with the group's Hypothesis token changes a work's level with the **Relevance** drop-down in its box. It is kept as a tag in the group (`tag:on:High`), and a tag naming a level comes before the field. So `library.json` gives the level every reader sees, and the group's choice overrides it for the group. Choosing **No level** takes the group's tag off, and the work falls back to its field. A level can also be set as a tag in `library.json` (`tags: ['High']`), or typed in the box's tag field. The level shows in its drop-down and its filter, not among the tags. Where any entry has it, **By relevance** is the first order, by author within each group, and there is a **Relevance** filter and a line in the record. An entry without it comes last. An entry with a number in `key` (1, 2, 3…) is a key work: in this order, key works come first by that number, ahead of the groups and whatever their relevance. Other orders ignore `key` for sorting. It replaces **As listed** in the menu on that bench, so `library: { order: 'listed' }` shows By relevance there, and a bench that sorted its manifest by hand can stop. A bench whose `library.order` names another order keeps it as what a reader sees first. Without the field, nothing changes.

## Key works

A key work carries a **Key work** badge on its cover, in the list and in its box, on any bench. There are two sources:

- `key` in `library.json`, which every reader sees.
- The mark in an entry's box, for members with the group's Hypothesis token. It is an annotation in the group (`key:on`, `key:off`), so members see it and readers outside the group do not. Any member can take off a mark, including one from `library.json`, and the latest mark counts. A mark added comes after the list's key works, in the order the marks were made.

To show a mark to every reader, set `key` in `library.json`. A bench with no annotation group has no button. The box does not change the order of key works: edit the numbers in `key` for that.

## Tags

An entry's tags show in its box, and **Filters** and the search read them. There are two sources, as for key works:

- `tags` in `library.json`, which every reader sees.
- The tags members add in the box with the group's Hypothesis token, one at a time with Enter, and suggested from those in use. Each is an annotation in the group (`tag:on:word`, `tag:off:word`), so members see it and readers outside the group do not. Any member can take off a tag, including one from `library.json`, and the latest counts.

To show a tag to every reader, put it in `library.json`. A bench with no annotation group shows its tags with no way to change them.

## Preprints

An entry with `kind: 'preprint'` carries a **Preprint** badge on its cover, in the list and in its box. A preprint kept beside its published version is a second entry, with the note on each naming the other.

## Sharing an entry

**Share** in an entry's box opens the system's share sheet (Mail, Messages, AirDrop on a Mac) with the entry's title and a link that opens its box. A browser with no share sheet, such as Firefox, copies the link. **Copy link** stays beside it and gives the same link.

Posted in a chat or on social media, the link shows one preview card for the whole Library, such as "Melville Library". `tools/release.js` writes it into `library/index.html` at each release, and that page sends a person on to the entry. A release needs `base` in `js/config.js`, or an `og:url` in `index.html`, to write it. Until the page exists, links go straight to the bench.

| On the card | Comes from, in order |
|---|---|
| Title | `library.card.title`, then the bench's `name` and `library.label` |
| Description | `library.card.description`, `library.intro`, then the `intro` in `library.json` |
| Image | `library.card.image`, the `og:image` in `index.html`, then a shelf of books from the kit |

An image should be 1200 by 630 pixels. Sites keep a card for a while, so a changed card can take time to show.

## A large library

The tab's **Filters** narrow by kind, relevance, language, rating, decade, author and tag, with counts. They come from the entries' `kind`, `relevance`, `lang`, `date`, `author` and `tags`, so a large library is easier to search where those are filled in consistently, with one spelling for a kind and for a surname. Give `lang` as a language code (`ja`, `de`): readers see its English name, here and in the record, where the browser knows it, and the code where it does not. Rating comes from the group's stars: the average to the nearest star, or Not rated. A facet with only one value does not show, so a bench with no ratings has no Rating filter.

Tried with 1,000 link-only entries in a browser: searching, filtering, ordering and switching view each took about 50 milliseconds or less, measured to the end of layout. There is no limit in the covers. A page of 1,000 covers is long to scroll, so search, the filters and the list do that work; `library: { view: 'list' }` starts a large library as a list.

## Transcripts and other forms

`alts` gives a work other forms, each on its own shelf:

```json
{ "id": "P-AAAAA", "title": "A recorded talk", "kind": "talk", "file": "library/files/talk.m4a",
  "alts": [{ "label": "Transcript", "lang": "en", "file": "library/talk-t1.md", "shelf": "private" }] }
```

A button below the work opens each one under it, so a transcript can be read while the recording plays. A private one shows for members only; its path is in the public manifest, as a private file's is.

## Citations

An entry's box shows a citation with a Copy button, in Harvard form, built from `author`, `date`, `title`, `in`, `publisher`, `pages` and `doi` or `url`. The author is used as written. `in` holding only a note in brackets, such as `(monograph)`, is left out. Where the built form is wrong, `citation` gives the citation as written.

## Notes on a work

The panel in an entry's box, and in a paratext's, holds notes in the bench's Hypothesis group, with replies and reactions as on a text, so they need that group's token and are visible to the group only. Without one, a note stays a draft in that browser. A note is an annotation with `item:<code>` in place of a version, tagged `bk:kind:item`, and pinned if wanted by `bk:at:t:<seconds>`, `bk:at:p:<page>` or `bk:at:q` with the quoted words. The code stays when an item moves from Paratexts to the Library, so its notes go with it.

Members also give an entry one to three stars and an emoji, in the same panel. Each is a reaction in the group with no parent, with `★1` to `★3` or the emoji as its text, and a person's latest rating counts. The average shows on the cover and **Order** can sort by it, an option offered only to a reader with the group's token. A paratext keeps its own ratings in its catalogue, so a rating there does not follow an item to the Library unless someone moves it by hand.

A cover shows a count, **Annotated** filters to those, and ✎ lists all the notes across the Library and Paratexts. Paratexts' cards show the count too. Paratexts' own comments and ratings remain as they were, kept in its catalogue and separate from these notes.

A pin goes back to its place on a held recording, on YouTube and Vimeo by restarting their player there, and on a PDF in the browser's viewer. A paratext's PDF, drawn page by page, does not yet go to a pinned page.

## Not in the kit yet

- **Comments on Library entries as in Paratexts' catalogue.** The Library has notes in the group instead.
- **A note pinned to a region of an image.**
