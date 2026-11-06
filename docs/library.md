# The Library: a guide for a bench

The Library tab (`library.js`) lists the secondary literature on a project: books, articles, chapters, talks, podcasts and documentaries. Each entry opens in a box over the bench, with its record, the file where one is held, and a link to where the work is published.

## What belongs where

- **Paratexts:** evidence, the material from or about the subject that the group studies. How a subject has been told is evidence where the group studies that. It stays private and reads with a member's token.
- **The Library:** secondary literature, the work on the subject that the group reads and cites.

Where a work could be either, the person running the bench decides. Whether a work may be public is also that person's decision: a session on a bench asks and does not settle it from its own reading of a licence.

## The three kinds of entry

| The work | The entry | What a reader without a token sees |
|---|---|---|
| Under a CC licence, or freely distributable | `file` in the bench's `library/files/`, `licence` saying which | The file |
| Held by the group, and neither of those | `shelf: 'private'`, `file` under `library/` in the private repository | The record, a line saying the group keeps a copy, and the link out if there is a `url` |
| Not held | no `file` | The record, and the link out if there is a `url` |

`url`, where the work is published, is optional on all three. An entry needs only `id` and `title`.

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

`README.md` lists an entry's fields. An `id` does not change once published, since links (`?tab=library&lib=<id>`) point at it.

## Files and size

A box shows PDF, text, Markdown, HTML, images, audio and video; any other file can be downloaded. A private file is read whole through GitHub before it opens, and GitHub holds no file over 100 MB. GitHub Pages limits a published site to 1 GB, so check the size of `library/files/` before pushing.

Members see the private repository's size above the list, with a warning above 800 MB. The figure is GitHub's and can lag: in a trial on 2026-11-06 it read 0 for a repository that had taken about 1 GB in the half-hour before. Moving or deleting a file within the repository does not reduce that size, since the history keeps the file. Reducing it means rewriting the history or starting a new repository, which is a decision for the person running the bench.

## Adding from the bench

A member with a token has **＋ Add a work** on the Library tab: a record, with a copy of the work or without. A member's token reaches the private repository only, so the entry goes in `library/additions.json` there, and a copy beside it as `library/<id>.<ext>`. Members see additions in the list at once, marked as not yet public, and can correct or remove them. Nobody else sees them. The token needs Contents read and write, as Paratexts asks. A copy added from the bench is limited to 40 MB, since GitHub's API took 41.5 MB and refused 42 MB in a trial on 2026-11-06; a larger one goes in through git, up to GitHub's 100 MB. GitHub also answered 502 to one of 31 uploads near 40 MB in that trial, and left nothing behind; the member is told to try again. Five members saving at the same moment all got through; of ten, three were told to try again and nothing was lost.

The person running the bench publishes additions to the public list, from a clone of the private repository:

```bash
node research/kit/tools/library-publish.js ../my-paratexts
```

That lists what is waiting and changes nothing. With `--write` it moves the entries into the bench's `library.json`, takes them out of `additions.json` and removes the name of who added them; `--only L-ABC12,L-DEF34` takes some and leaves the rest. It commits nothing: commit and push each repository. An entry published with a copy stays on the private shelf, with the record and file path public. To make the file itself public, once its licence allows it, move it to the bench's `library/files/` and change its `file` and `shelf` in `library.json`.

## A copy kept as a paratext

An item that stays in Paratexts can name a Library entry, with `library: [id]` in its record or a tag `library:<id>`. A member then sees it in that entry's box. The public manifest does not name the paratext.

## Not in the kit yet

- **Comments.** Paratexts has them; the Library has none.
- **Moving an item out of Paratexts.** There is no tool for this. Leave existing items where they are, and ask the bench-kit session.
- **Transcripts.** An entry has no field for a recording's transcript.
