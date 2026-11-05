# Bench templates

A template is the starting state of a new research bench of one kind: its page, its settings, its own scripts and an invented example to replace. A bench made from it is a repository of its own, with bench-kit as a git submodule at a pinned release. `docs/bench-types.md` describes the kinds; `docs/advising.md` what to settle before starting; `docs/lessons.md` what the benches so far have taught.

| Template | For | Page at | Kit at |
|---|---|---|---|
| `translation/` | a translation made by the vector translation method, read beside its source | the repository's root | `kit/` |
| [bench-template](https://github.com/critical-code-studies/bench-template) | a program in its versions (code bench); with Book turned on, a text in its witnesses (prose bench) | `research/` | `research/kit/` |

## Making a bench

```bash
node tools/new-bench.js translation ~/Projects/kuki-bench --name "Kuki" --org vector-humanities --repo kuki-bench
```

The tool copies the template, puts the bench's name, slug, storage prefix, repository and addresses in place of the example's, makes it a git repository with bench-kit as its submodule at the release the tool belongs to (or `--kit vX.Y.Z`), and lists what is left to edit (every `EDIT` in `js/config.js` and `js/versions.js`). It writes nothing outside the new folder and pushes nothing.

Then:

1. Replace the example texts with the bench's own (for a translation: `text/`, `glossary.csv`, `checks/`, `source/`), and list them in `js/versions.js`.
2. Fill `js/config.js`: the descriptor (`translation`), the Hypothesis group, the paratexts repository, the About box.
3. For page images: `node kit/tools/iiif-map.js <manifest> --out js/images.js`, and load `js/images.js` after `js/config.js` in `index.html`.
4. Run the tests (`node kit/tools/test.js --dir .`) and every view (`node kit/tools/views.js --kit kit --dir .`).
5. Make the repository on GitHub, push, turn on Pages, and add the bench to bench-kit's CI matrix.

## Keeping a template

A template changes with the kit: when a kit release changes what a bench must load or set, the templates change in the same release. The template's own tests run in bench-kit's CI as a bench does.
