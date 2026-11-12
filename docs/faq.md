# bench-kit: frequently asked questions

Questions about bench-kit and the research benches built on it, for readers of a bench, members of a bench's group, and people making a bench of their own. The [site](index.html) has the quick start, the configuration and the troubleshooting list; the [README](https://github.com/critical-code-studies/bench-kit#readme) lists every module and setting.

## The kit

### What is bench-kit?

The plain JavaScript and CSS that the research benches share. A bench sets out each version of a program or text line by line, collates any two, draws their descent as a stemma, and keeps a group's annotations beside the lines they are about. The kit holds the views and the frame; each bench supplies its own texts, settings and reader.

### What is a research bench?

A website for the close study of one work in its versions, kept as a repository of its own. Every view refers to the same unit, the line of a file of a version, so a reference, an annotation, a collation and a place in a page all point at the same thing.

### What kinds of work can a bench hold?

Three kinds so far, set out in the [bench types guide](https://github.com/critical-code-studies/bench-kit/blob/main/docs/bench-types.md):

| The work is | Type | Benches |
|---|---|---|
| a program, in versions | code | Spacewar!, SHRDLU, ELIZA, CCSbench |
| a text in its witnesses or stages, transcribed or encoded | prose | Melville (*Billy Budd*) |
| a translation with its source, glossary and change history | translation | Kuki (*The Problem of Contingency*) |

A work that fits none of these takes the nearest type and turns off what it does not use.

### Does a bench need a server, a database or a build step?

No. A bench is static files read by the browser. It has no server of its own, no environment variables and no API keys, and nothing is compiled. It is published with GitHub Pages, or any host of static files.

### What does it cost?

Nothing. The kit is free software, GitHub Pages hosts a public repository without charge, and a Hypothesis account is free.

### What is the licence?

The GNU General Public License, version 3. `wordcloud.js` ports the layout of word_cloud (© 2012 Andreas Christian Mueller, MIT License); its notice is in `docs/wordcloud-LICENSE.txt`.

### How do I cite it?

Every release is archived on Zenodo. The DOI [10.5281/zenodo.23715201](https://doi.org/10.5281/zenodo.23715201) stands for all versions and resolves to the latest; each release also has a DOI of its own on that record. The repository's `CITATION.cff` gives the details, which GitHub shows under "Cite this repository":

> Berry, D. M. (2026) *bench-kit: shared modules for the critical code studies research benches* (version used). doi: 10.5281/zenodo.23715201.

A bench is cited by its own DOI, shown in its About box, where it has one.

## Making a bench

### How do I start one?

From [bench-template](https://github.com/critical-code-studies/bench-template), which has the kit in place and runs on an invented example. On GitHub, choose **Use this template**, clone the new repository with `git clone --recurse-submodules`, serve its folder (`python3 -m http.server 8000`) and open `http://localhost:8000/research/`. Then replace the example's sources, versions and settings. The site's [quick start](index.html#start) gives each step. A translation bench starts from `templates/translation/` in the kit.

### What do I need installed?

To run a bench: git, Python 3 for a local web server (any static server will do) and a current browser. To run the kit's checks: Node 22 or later, and Google Chrome or Chromium. There are no npm packages.

### What does the bench supply, and what does the kit do?

The bench supplies four files: `js/versions.js` (its versions and their files), `js/config.js` (its settings, `SW.BENCH`), `js/core.js` (how its files become lines) and `js/main.js` (its views, in the order of the tabs), with its sources and its tests. The kit draws the views from those.

### Can I change the kit's files inside my bench?

A change made in a bench's copy of the kit is lost when the bench next takes a newer kit. Changes are made in bench-kit itself and released, and each bench then moves to the release. A bench shapes its views through its settings and hooks, and `menusOff` leaves out a tab or a menu item it does not use.

### How do I take a newer kit?

The kit is a git submodule of the bench (`research/kit` in the code template). Move it to the release's tag, then run the bench's release tool, which raises the `?v=` on every script and stylesheet so that browsers fetch the new files:

```
git -C research/kit fetch --tags
git -C research/kit checkout vX.Y.Z
node research/kit/tools/release.js next "kit X.Y.Z: what changed" --kit vX.Y.Z
node research/kit/tools/test.js
```

Commit the new pointer with the files the tool changed. The kit's `CHANGELOG.md` says what each release changed.

### How do I check a bench after a change?

Two tools, run from the repository's folder. `node research/kit/tools/test.js` runs the kit's tests in the bench's own page, in headless Chrome, so they check the kit with the bench's settings and versions. `node research/kit/tools/views.js` opens each view in turn and fails on one that throws, draws nothing or could not load; with `--kit ../bench-kit` it tries another copy of the kit without changing the bench.

### How does a bench get a DOI?

Through Zenodo, which archives a GitHub repository each time a GitHub Release is published; a tag alone is not enough. The account holder turns the repository on at zenodo.org ▸ Account ▸ GitHub, a Release is published, and the DOI for all versions goes in `about.doi` in `js/config.js`. The README's section "A bench's DOI" has the steps.

## Reading and annotating

### Do I need an account to read a bench?

No. Without any token a bench reads, collates and draws as usual. Annotations written without a token stay as drafts in that browser, and the paratext archive stays closed.

### How do I join a bench's annotation group?

In two steps, in this order. First join the bench's private Hypothesis group from the invitation; Help ▸ Annotating and sharing ▸ Getting set up takes each step in turn. Then make an API token at [hypothes.is/account/developer](https://hypothes.is/account/developer) and paste it into ⚙ Settings ▸ Annotations, with the group's link. **Test connection** there says whether the token and the group are right.

### Who can see what I write?

An annotation saved with a token goes to the bench's private Hypothesis group, under the name of the Hypothesis account, and its members can read it. A draft stays in the browser it was written in. Ratings, Key work marks and tags in the Library may be published for readers with no token, without the text of any note, where the bench runs the snapshot tool.

### Where are my notes, drafts and settings kept?

In the browser's own storage, under the bench's prefix, for that browser and that address only. Help ▸ Your bench ▸ Back up my data saves them to a file, without the tokens, and Restore my data puts them back. Safari clears a site's stored data after seven days without a visit, and a token kept there goes with it; a new one is made the same way as the first.

### Why does the published bench ask for my token again?

Tokens are kept for each address. One pasted at `localhost` is not at the bench's published address, so paste it again in ⚙ Settings there.

### What are Paratexts, and why do they need a GitHub token?

Paratexts are the scans, documents and recordings a group collects about its subject, kept in a private GitHub repository that the bench names. Each member needs access to that repository and a fine-grained token of their own: accept the repository's invitation, then use ⚙ Settings ▸ Paratexts ▸ Open the token form, choose **Only select repositories** and the archive, with Contents set to read and write, and paste the token into Settings.

### What is the Library?

The secondary literature on the project: books, articles, chapters, theses, talks, podcasts, films and web pages, as covers, a list, a gallery or a card catalogue. Members rate works, mark key works, tag them and keep a To read shelf. The [Library guide](library.html) covers setting it up.

## Pages and images

### Can the text be tied to its place on the page's image?

Yes, with highlight links in Book. The words under the pointer are lit on the image, a place on the image lights its words, and a click on either holds both. The places come from the bench's data, in one of three forms: the boxes revisions are written in (`doc.zones`), the lines of a page (`pb.lines`, as in the Melville bench's manuscript), or, for a text whose lines are not the page's, a support file of each page's passages (`doc.regions`, as in the Kuki bench, where each sentence of the translation is tied to its columns on the 1948 page). The site's [Book section](index.html#book) shows each.

### How exact are the places?

As exact as the bench's data. Melville's lines are measured or, where marked, estimated from the revisions' boxes. Kuki's places are estimated from each sentence's share of the page's text, and are drawn with a dashed edge while the pointer is on the image; the picture that Share highlight makes says that the place is approximate.

### Can I send someone a passage with its page?

Yes. With a passage's highlight link held, **Share highlight** makes a picture of the page with the place marked and the passage beside it, with the bench's citation and the image's credit. Copy link gives a link that opens the bench with the same highlight held; Email… starts a message with the picture and the passage; Download PNG and Copy PNG give the picture. **Share page** copies a link to the page as it is set.

### Can I change the highlight's colour, or turn it off?

In ⚙ Settings ▸ Book ▸ Highlight links: a colour of your own, the bench's default, or the links off, kept in that browser. The same pane trims the pages' edges.

### Should a bench take its page images from a library's image service?

Where the rights allow, a bench holds its own copies and asks the library for nothing. A library's image service may refuse a bench's readers when many images are asked for at once, and pages then fail to load for everyone. Where the rights do not allow copies, a bench asks through a queue, a few images at a time.

## When something goes wrong

### The bench shows "Could not load", or a blank page

The three usual causes, each with its message in the site's [troubleshooting list](index.html#trouble):

- **The bench was opened as a file.** It reads its sources over HTTP: serve the repository's folder and open `http://localhost:8000/research/`.
- **The server was started in `research/`.** The sources beside it are then out of reach: start it in the repository's folder.
- **The repository was cloned without its submodule,** so the kit's folder is empty: run `git submodule update --init`.

### After moving to a newer kit, the bench behaves as before

The browser kept the old files. Run the bench's release tool, which raises `?v=` on every script and stylesheet, then reload with the cache bypassed.

### My annotations are saved as drafts only

The bench has no working token for its group at that address. Paste the token in ⚙ Settings ▸ Annotations and use **Test connection**: it says whether the token was accepted and whether the account is a member of the group.
