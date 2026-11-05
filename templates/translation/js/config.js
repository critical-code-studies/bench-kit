/* config.js - this bench's settings for bench-kit (kit/). Loaded after kit/base.js, before the rest of the kit and the bench's own scripts.
 * Every value marked EDIT is the template's example: change it for your bench. The kit's README lists every setting;
 * kit/docs/bench-types.md describes a translation bench. */
(function (root) {
  'use strict';
  var SW = root.SW;
  SW.BENCH = {
    name: 'Example Translation',                           // EDIT: as in "the Example Translation research bench"
    title: 'Example Translation Research Bench',           // EDIT: the page title and the About box
    slug: 'example-translation',                           // EDIT: file names of exports and backups
    store: 'extrbench.',                                   // EDIT: the prefix of this bench's keys in the browser's storage (unique per bench)
    base: 'https://vector-humanities.github.io/example-bench/',   // EDIT: where the bench is published
    repo: 'https://github.com/vector-humanities/example-bench',   // EDIT: its repository
    lang: 'plain',                                         // the texts' reader for Collate and Genealogy (kit/lang-plain.js)
    textLang: 'ja',                                        // EDIT: the source's language (the word breaker, search, the lang of source words)

    // the translation, as the vector translation method lays it out (kit/vt-reader.js): what differs
    // from the method's layout. EDIT
    translation: {
      versions: { literal: 'literal', readable: 'readable', ocr: 'ocr' },   // the ids in js/versions.js
      page: '\\[p\\. (\\d+)\\]',                           // the page marker
      image: '\\[コマ (\\d+)\\]',                          // the image marker (the library's image number), or null
      body: { until: '^#+ (Appendix|Glossary)' },          // where the apparatus begins
      glossary: { path: 'glossary.csv', kind: 'csv' },     // or { path: 'Translation.md', kind: 'md', heading: 'Glossary' }
      changes: ['checks/changes-1.md'],                    // the change lists, each path
      ocr: { path: 'source/ocr.txt', split: '^=== PAGE (\\d+)' },
      // the half of the image a page is on, where the library's images are spreads (vertical Japanese:
      // the odd page on the right); null where each image is one page
      side: function (page) { return page % 2 ? 'right' : 'left'; }
    },

    refs: { names: { literal: 'LT', readable: 'RT', ocr: 'SRC' }, prefix: 'EX-', dir: '' },   // EDIT: [REF: RT, 01.md:12]
    forks: [['translation', 'The translation'], ['source', 'The source']],
    start: 'readable',
    comment: [],

    // Book: the pages, the source's image to the left, the literal and the readable side by side
    doc: {
      versions: ['literal', 'readable'],
      beside: ['readable'],
      besideMax: 2,
      imageSide: 'left',
      imagesFirst: true,                                   // the page's image once, beside the first text
      words: { page: 'page' },
      // a page's image from the library's IIIF service (js/images.js, made by kit/tools/iiif-map.js), the
      // half the page is on; null until the bench has its image map
      image: function (pb) {
        var map = root.SWImages, x = map && pb.img != null && map.images[String(pb.img)];
        if (!x) return null;
        var side = SW.BENCH.translation.side;
        return SW.iiifImage(x, { region: side ? side(+pb.facs) : null });
      },
      imageCredit: ''                                      // EDIT: the library's credit for its images (HTML)
    },

    folder: true,                                          // File ▾ ▸ Open a folder…: a working copy, read in place of the published files
    library: true,                                         // the Library tab, from library/library.json
    // dictionaries in the source's language (kit/dictionary.js; kit/tools/dict-build.js jmdict … --lang ja)
    dictionaries: [],                                      // EDIT: e.g. [{ id: 'jmdict', name: 'JMdict', base: 'data/jmdict/', lang: 'ja', credit: 'JMdict, EDRDG, CC BY-SA 4.0' }]
    menusOff: ['topics'],                                  // EDIT: take 'topics' out once a model is made (kit/docs/topics-guide.md)

    about: {
      icon: '<img src="img/icon.svg" alt="" width="40" height="40">',
      author: 'Your Name', citeAuthor: 'Name, Y.',          // EDIT
      purpose: 'A bench for reading a translation made by the vector translation method beside its source: the pages, the glossary, the changes. This is the template: replace this text.',   // EDIT
      inside: 'The literal and readable translations, divided into lines and set as pages; the glossary; the change lists; the source as OCR.',   // EDIT
      sources: 'An invented example. Details under Versions.',   // EDIT
      code: 'https://github.com/vector-humanities/example-bench',   // EDIT
      catalogue: { skip: [], held: 'held' }
    },
    theme: { label: 'Bench', note: 'light text on a dark ground (the default)' },
    accent: { dark: '#e58be0', light: '#a3317a' },
    group: '',                                             // EDIT: the Hypothesis group's ID, once you have made one
    relation: 'Example Translation, ',
    settings: {
      tour: 'A few stops through the pages, the glossary and the changes; about a minute.',
      groupPlaceholder: 'https://hypothes.is/groups/…',
      themeHint: 'The colours of the whole bench. The ◐ button in the top bar switches between your last light and dark themes.'
    },
    tag: 'vt:',
    tagsHint: 'e.g. term, rendering, revision',
    annoHelp: {
      manual: 'https://github.com/vector-humanities/vector-translation', manualName: 'the vector translation method',
      start: 'Contingency, it is said', search: 'contingency',
      refA: 'CD, RT, 01.md:5', refB: 'EF, LT, 01.md:5',
      noteA: 'On the rendering of 偶然…', noteB: 'The literal has chance…', quoteA: 'On the rendering of 偶然…',
      boxA: 'Readable translation, 01.md, line 5', boxB: 'Literal translation, 01.md, line 5',
      tryText: 'The source’s `偶然`', code: '`偶然`',
      caption: 'A link from an annotation on the readable to one on the literal'
    },
    compare: { comment: '', normalised: false, reading: 'Reading', modes: ['text'] },
    comparePrefix: 'Example Translation: ',
    genealogy: { set: ['literal', 'readable'], line: 'main', lineNames: { main: 'Source, literal, readable' } },
    // the group's private collection, named Parallel texts here (a paratext, on a translation bench, is the
    // translator's preface and notes, which the bench shows in its public text)
    paratexts: { org: 'vector-humanities', repo: 'example_paratexts', cache: 'example-paratexts', words: { one: 'parallel text', many: 'parallel texts' } },   // EDIT: a private repository for the group's copies
    examples: { date: 'e.g. 1935', archive: 'e.g. National Diet Library', versions: 'e.g. literal, readable', refs: 'e.g. [REF: RT, 01.md:5]', publisher: 'e.g. Iwanami Shoten', finding: 'F1' },
    stemma: { root: 'ocr', lostBetween: {}, skip: [], lostOnTrunk: false },
    edition: { built: function () { return ['Read as', 'Markdown, divided into lines']; }, layout: function (raw) { return String(raw); }, words: true, files: ['all files', 'Every file'] },
    refHelp: {
      example: '[REF: RT, 01.md:5]',
      about: '<p><b>RT</b> (the readable; <b>LT</b> the literal, <b>SRC</b> the OCR), then the file (<b>01.md</b>) and the lines (<b>5</b>).</p>',
      form: 'Form: [REF: RT, <file>:<lines>], e.g. [REF: RT, 01.md:5].',
      versions: { title: 'The texts', all: true }
    },
    sitemap: true
  };
})(typeof window !== 'undefined' ? window : globalThis);
