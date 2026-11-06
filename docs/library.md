# The Library: a guide for a bench

The Library tab (`library.js`) lists the secondary literature on a project: books, articles, chapters, talks, podcasts and documentaries. Each entry opens in a box over the bench, with its record, the file where one is held, and a link to where the work is published.

## What belongs where

- **The Library:** secondary literature, the writing and recording about the project's subject.
- **Paratexts:** evidence, the material the group's findings rest on. It stays private and reads with a member's token.

Where a work could be either, the person running the bench decides. Whether a work may be public is also that person's decision: a session on a bench asks and does not settle it from its own reading of a licence.

## The three kinds of entry

| The work | The entry | What a reader without a token sees |
|---|---|---|
| Under a CC licence, or freely distributable | `file` in the bench's `library/files/`, `licence` saying which | The file |
| Held by the group, and neither of those | `shelf: 'private'`, `file` under `library/` in the private repository, `url` where it is published | The record, the link out, and a line saying the group keeps a copy |
| Not held | no `file`, `url` where it is published | The record and the link out |

A member with a token opens a private file in the same box. The manifest is public, so a private entry's record, shelf and file path can be read by anyone, and the list shows that the group holds the work. File names on the private shelf are public for that reason.

## Adopting it

1. In `js/config.js`, set `library: true`. The private shelf uses the repository in `paratexts`, or `library: { private: { org, repo } }`.
2. In `index.html`, load `kit/library.js` after `kit/paratexts.js` (where the bench has it) and `kit/md.js`, and before `kit/shell.js`.
3. Write `library/library.json`:

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

4. Put public files in the bench's `library/files/`, and private files under `library/` in the private repository. Paratexts does not list that folder.
5. Run the bench's tests and every view (`tools/test.js`, `tools/views.js`).

`README.md` lists an entry's fields. An `id` does not change once published, since links (`?tab=library&lib=<id>`) point at it.

## Files

A box shows PDF, text, Markdown, HTML, images, audio and video; any other file can be downloaded. A private file is read whole through GitHub before it opens, and GitHub holds no file over 100 MB. Members see the private repository's size above the list, with a warning above 800 MB. GitHub Pages limits a published site to 1 GB, so check the size of `library/files/` before pushing.

## A copy kept as a paratext

An item that stays in Paratexts can name a Library entry, with `library: [id]` in its record or a tag `library:<id>`. A member then sees it in that entry's box. The public manifest does not name the paratext.

## Not in the kit yet

- **Moving an item out of Paratexts.** There is no tool for this. Leave existing items where they are, and ask the bench-kit session.
- **Transcripts.** An entry has no field for a recording's transcript.
