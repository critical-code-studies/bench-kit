# Topic models for a bench: a guide

A bench makes, chooses, publishes and keeps up its own topic models. The kit supplies the engine (`topics.js`, on mallette, MALLET's topic model in JavaScript), the tool that builds a model from the bench's documents (`tools/topics.js`), and the Topics tab that shows the models and lets readers run their own. The bench supplies its documents, decides which model to publish, and rebuilds it when its text changes.

This guide is for whoever looks after a bench: its maintainer, or the session that works on it.

## 1. What the bench provides, and what the kit does

| The bench | The kit |
|---|---|
| Its documents: what a document is, cut from its texts, each with an id that does not change | Taking stopwords, short words and rare words out, as the settings say |
| The sets of documents a reader may model (the whole text, a stage of a manuscript…) | Training with mallette, the same model as MALLET for the same documents and seed |
| Where its text comes from (its version, its sources' commits) | Writing the model file, with its settings, check, source and fingerprint |
| The choice of model to publish, and the model file in its repository | Showing the models, warning when the text has changed, readers' own runs |
| Rebuilding the model when its text changes | |

## 2. Turning it on

The bench needs bench-kit with the topics engine (0.95.0 or later). In its `index.html`, after `kit/lenses.js` and after the script that defines its documents, and before `kit/shell.js`:

```html
<script src="kit/mallette.js?v=…"></script>
<script src="kit/topics.js?v=…"></script>
```

The kit adds the Topics tab to the tab row (after Book, or after the lens menus) when `SW.BENCH.topics` is set. `menusOff: ['topics']` leaves the tab out while the models are being prepared.

## 3. The documents

```js
SW.BENCH.topics = SW.BENCH.topics || {};
SW.BENCH.topics.documents = function (o) {   // o.set, o.chunk (400), and the set's choice (o.stage…)
  return Promise.resolve([{ id: 'rt-c12-2', label: 'Chapter 12, part 2', tokens: ['the', 'captain', …],
                            meta: { chapter: 12, chapterLabel: 'Chapter 12', from: [p, n], to: [p, n], seq: 47 } }]);
};
```

- **What a document is.** LDA models documents as mixtures of topics, so a document should be long enough to have a mixture and short enough to have few topics. Chunks of about 400 words within the bench's own units (chapters, scenes, files, leaves) work for prose. A chunk never crosses a unit's boundary; a short last chunk joins the one before.
- **ids** must be the same every time the documents are made, for the same text. A model's id is made from them, and a model file points at its documents by them. Build them from the unit and the chunk's number (`rt-c12-2`), never from a position in a list that could shift.
- **tokens** are the words, lower-cased, in order, stopwords still in (the kit takes them out). Leave out what is not the text of the work: editors' and transcribers' notes, line numbers, markup, running heads, shelfmarks, and an author's own memos and dates written on the manuscript (his words, but not the work's). A topic of words such as *leaf*, *text*, *line* is a sign that apparatus has got in.
- **meta** is whatever leads back to the text and groups the documents: where the document starts and ends (`from`, `to` as the bench's file and line, `[p, n]`), its place in the reading order (`seq`), and the bench's units (`chapter` as a number for ordering and `chapterLabel` for showing). A document outside the bench's numbered units keeps `chapter: null` and a label of its own.
- The function fetches what it needs itself (with `SW.build`). The tool runs it in the bench's own page, so it only has to work there.

Test it in the bench's own tests: every token in exactly one document; the same ids when made twice; a known unit gives the expected ids and meta.

## 4. Sets, source and stopwords

```js
SW.BENCH.topics.sets = [
  { id: 'reading', label: 'The reading text' },
  { id: 'stage', label: 'A stage of the manuscript', param: 'stage', choices: function () { return [[0, 'Before revision'], …]; } }
];
SW.BENCH.topics.source = function () {
  return { bench: SW.VERSION, sources: [{ name: 'MEL', repo: 'https://github.com/…', commit: '35c6cd80…' }] };
};
```

- **sets** are the documents a reader may model in the tab, and what the tool's `--set` and `--choice` name. Without them there is one set, `text`.
- **source** is read whenever a model is made and recorded in it. The tab compares it with the bench's source now and warns when a source's commit has changed (the lines may have moved). It also recomputes the documents' fingerprint (their ids and token counts) and warns when the bench now cuts or tokenises them otherwise. Give the commit each source is pinned at.
- **stopwords** are the bench's (`SW.BENCH.topics.stopwords`, else its `textstats.stopwords`), else MALLET's English list. The model records which, and a hash of the list.

## 5. Building a model

From the bench's repository (with Google Chrome and Node 22):

```bash
node research/kit/tools/topics.js --set reading --k 8,12 --min-count 2,3 --seeds 1,2,3,4,5
```

(`kit/tools/topics.js` and `--dir .` for a bench whose page is at its root.) The tool opens the bench in headless Chrome, takes its documents, trains a model for every setting and seed, and prints a table: for each setting, the share of its topics that recur in its other seeds. Then, for the steadiest setting and seed, each topic and the number of other seeds it recurs in. Nothing is written yet.

Two topics are taken to be the same by the **cosine** of their word probabilities (each topic's (count + beta) / (tokens + V·beta) over its model's words, compared over the union of the two models' words, 0 where a word is not one model's). The threshold is calibrated, not fixed: the lower quartile of the cosines of topics that are each other's best match across two seeds of one setting, over every setting tried. The table gives it, and how it was found. The overlap of the top 20 words (Jaccard 0.3 or more), the earlier measure, is given beside it. On the Melville bench's reading text the threshold came to 0.695 (357 pairs, median 0.788).

Reading the table:
- **Topics that recur across seeds** are the ones the documents support; a topic found by one seed only is the sampler's, not the text's. Publish a model whose topics mostly recur, and say which do not.
- **The number of topics (K).** Fewer documents support fewer topics. On the Melville bench, 80 documents of the reading text: 8 topics recurred 85% of the time by cosine (79% by Jaccard), 12 topics under 60%.
- **The minimum count.** A word seen once cannot link two documents. 2 keeps more of a short text than 3.
- **Seeds:** five is enough to see which topics recur. More iterations (`--iterations`, 1000) do not make an unsteady setting steady.

Then write the chosen model:

```bash
node research/kit/tools/topics.js --set reading --k 8,12 --min-count 2,3 --seeds 1,2,3,4,5 --write auto --name "The reading text, eight topics" --note "…"
```

`--write auto` takes the setting whose topics recur most (the fewer topics on a tie) at its steadiest seed; `--write k=8,min=2,seed=5` takes one by hand. Only the chosen model is written, to `topics/<id>.json`, with the check (the settings compared, how far each recurs, the choice) inside it. `--note` keeps a note in the file: what the documents are, and what the model can and cannot show.

## 6. Publishing

List the model in the bench's config, commit the file and release the bench:

```js
SW.BENCH.topics.models = [{ id: 'M-771c6b', name: 'The reading text, eight topics', url: 'topics/M-771c6b.json', note: '…' }];
```

The first model listed is the one the tab uses unless the reader chooses another. A model's id is fixed by its settings and documents, so "topic 3 of M-771c6b" in a finding or an annotation means the same topic for every reader, for as long as the file is published. Topics are numbered from 1 in the tab and from 0 in the file.

## 7. When the text changes

When a source moves to a new commit, or the bench changes how it cuts or tokenises its documents, the tab warns on every model made before. Rebuild with the same command; the new model has a new id. Keep the old file published while findings or annotations cite it, with a note that it was made from the earlier text, and list the new one first.

## 8. Comparing two models

```bash
node research/kit/tools/topics.js --set stage --choice 0 --k 8 --min-count 2 --seeds 1,2,3,4,5 --write auto --compare topics/M-771c6b.json
```

This matches the new model's topics with another's both ways, by cosine, at the threshold the new model's own seed check calibrated (`--threshold` gives one instead), and keeps the result in the new file: every topic of each model with its best partner, its cosine and, beside it, the Jaccard of their top 20 words, best first; the vocabularies compared; and for each of the new model's topics below the threshold, the documents that carry most of it.

A topic below the threshold is a candidate, not a finding. Two texts score lower against each other than one text across seeds, so a theme kept in other words can fall just below; read a near miss (0.698 against 0.703) differently from a topic with no partner at all (0.342). Look too at whether the topic recurred across its own seeds: one that did not is the sampler's, and its lack of a partner means nothing. On the Melville bench, a stage-0 topic of *back took i'll aloft pipe* had no partner (0.342) and recurred in none of its other seeds.

## 9. Readers' own models

Readers run models in the tab: any set the bench gives, any number of topics, seed, iterations and minimum count. They run in the background in the reader's browser and are kept there, and can be exported and imported. The same settings and documents give the same file as the tool's, apart from the name and date, so a reader's model can be published by the bench as it is.

## 10. A checklist

- [ ] `documents(o)` gives stable ids, the text's own words, meta that leads back to the lines; the bench's tests check it
- [ ] `sets`, `source()` and (if the bench has its own) `stopwords`
- [ ] `kit/mallette.js` and `kit/topics.js` loaded; `menusOff: ['topics']` until a model is ready
- [ ] the tool run with several settings and five seeds; the table read
- [ ] the chosen model written with `--name` and `--note`, listed in `topics.models`, committed
- [ ] the tab tried: the model's card shows no warning; its first topics are what the table showed; Help ▸ Topic models opens
- [ ] the bench's WORKING.md records the command, the choice and why
