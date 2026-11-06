/*
 * tests/vt.test.js - checks of kit/vt-reader.js on small texts laid out as the vector translation
 * method lays them out: lines and markers, Book's document, the glossary (CSV and Markdown, pairs and
 * collisions), change lists (the method's form and the first run's), whether a change is applied, and
 * search in OCR with old character forms folded.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, eq = T.eq, VT = window.SWVT;
  var text = '# A book\n\n## Chapter 1 (第一章) [コマ 7-8]\n\n[p. 1] [コマ 7] The first *page* begins[^1] here and [p. 2] runs on.\n\n<!-- working -->\nnot read [p. 99]\n<!-- /working -->\n\n[^1]: A note.\n\n## Appendix\n\nAfter the body.\n';
  var t = VT.read(text, { image: '\\[コマ (\\d+)\\]' });
  T.group('Translation: a text read');
  eq('pages and images found, with their lines, not in working notes', [t.pages.map(function (g) { return [g.page, g.n]; }), t.images.map(function (g) { return g.img; })], [[[1, 5], [2, 5]], [7]]);
  eq('a heading: its title, the source’s title and the image range', [t.lines[2].title, t.lines[2].orig, t.lines[2].imageRange], ['Chapter 1', '第一章', '7-8']);
  eq('a note’s definition', t.notes['1'], 11);
  eq('the body ends where the apparatus begins', t.bodyEnd, 13);
  eq('the author’s text begins after the translator’s front matter', VT.read('## Preface\n\nMine.\n\n## Chapter 1\n\nHis.\n', { body: { from: '^## Chapter' } }).bodyStart, 5);
  eq('the page a place is on', [VT.pageAt(t, 5, 0), VT.pageAt(t, 5, 60), VT.pageAt(t, 3, 0)], [1, 2, null]);
  var d = VT.doc(t), pbs = d.blocks.filter(function (b) { return b.t === 'pb'; });
  eq('Book’s document: a page break to each page, with its image', pbs.map(function (b) { return [b.facs, b.img]; }), [['1', 7], ['2', 7]]);
  eq('a paragraph divided at a page break goes on (cont)', d.blocks.filter(function (b) { return b.t === 'p' && b.cont; }).length, 1);
  eq('italic as a mark, the note reference kept', VT.inline('a *b* c[^1]').map(function (x) { return [x.s, (x.marks[0] || {}).k || null]; }), [['a ', null], ['b', 'hi'], [' c', null], ['', 'ref']]);
  T.group('Translation: the glossary');
  var csv = 'source,reading,english,competitors,scope,decided,notes\n偶然,ぐうぜん,contingency;chance,,,2026-10-01,\n根據,こんきょ,ground,,,,\n理由,りゆう,ground;reason,,,,\n';
  var gl = VT.glossary(csv, 'csv');
  eq('rows from glossary.csv', gl.map(function (g) { return [g.source[0], g.english]; }), [['偶然', ['contingency', 'chance']], ['根據', ['ground']], ['理由', ['ground', 'reason']]]);
  eq('an English word that renders two source terms', VT.collisions(gl).map(function (c) { return c.english; }), ['ground']);
  var md = '## Glossary\n\n| Japanese | Reading | English |\n|---|---|---|\n| 存在 / 非存在 | そんざい / ひそんざい | existence / non-existence |\n';
  eq('a Markdown pair split, one row to each term', VT.glossary(md, 'md', { heading: 'Glossary' }).map(function (g) { return [g.source[0], g.english[0]]; }), [['存在', 'existence'], ['非存在', 'non-existence']]);
  T.group('Translation: change lists');
  var ch = VT.changes('### translation | p. 12\nOLD: the chance\nNEW: the contingency\nSRC: 偶然\nWHY: the glossary\nORIGIN: witness W1\n\n### p. 13 | CHANGES\nOLD: a\nNEW: b\nJP: 甲\n\n## Literal problems\n- p. 14 a reading in doubt\n', 'checks/x.md');
  eq('the method’s form and the first run’s', ch.map(function (c) { return [c.target, c.page, c.kind, c.src]; }), [['translation', 12, null, '偶然'], ['translation', 13, 'CHANGES', '甲'], ['literal', 14, 'PROBLEM', '']]);
  eq('origin: a witness, with its id', VT.originOf(ch[0]), { k: 'witness', id: 'W1' });
  eq('readable, the translation’s old name, read as translation', [VT.changes('### readable | p. 1\nOLD: a\nNEW: b\n', 'x')[0].target, VT.applied({ target: 'readable', old: 'a', new: 'b' }, { translation: 'b' }), VT.layout({ versions: { readable: 'rd' } }).versions.translation], ['translation', 'applied', 'rd']);
  eq('applied, pending, both, gone', ['the contingency here', 'the chance here', 'the chance and the contingency', 'nothing'].map(function (s) { return VT.applied(ch[0], { translation: s }); }), ['applied', 'pending', 'both', 'gone']);
  eq('a NEW of two paragraphs is applied when a note is inserted between them', VT.applied({ target: 'translation', old: 'x', new: 'one\n\ntwo' }, { translation: 'one\n\na note added\n\ntwo' }), 'applied');
  T.group('Translation: the source');
  var pages = VT.ocr('=== PAGE 7\n偶然性の\n問題\n=== PAGE 8\n借然性\n', null);
  eq('OCR divided by image, its line breaks no matter', VT.search(pages, '偶然性の問題').map(function (h) { return h.img; }), [7]);
  eq('old character forms folded', VT.fold('偶然の實體'), '偶然の実体');
  eq('one character wrong, marked near', VT.search(pages, '偶然性', { fuzzy: true }).map(function (h) { return [h.img, h.near]; }), [[7, false], [8, true]]);
  T.group('Translation: the figures');
  var figText = VT.read('![Figure 1](figures/a.png)\n\n**Figure 1.** One[^2] of *two*. Labels: 甲 first.\n\n![Figure 2](figures/b.png){overlays="no"}\n\n**Figure 2.** Two. Key: a, b.\n\n<!-- working -->\n![Figure 9](figures/w.png)\n<!-- /working -->\n');
  eq('image lines, not those in working notes; the key apart from the caption, its word kept', VT.figureLines(figText).map(function (f) { return [f.num, f.noOverlays, f.caption, f.key]; }), [[1, false, 'One of two.', 'Labels: 甲 first.'], [2, true, 'Two.', 'Key: a, b.']]);
  var figHead = 'n,file,original,page,image,region,overlays,placement,labels_note\n';
  var figGood = figHead + '1,figures/a.png,figures/raw/a.jpg,77,45,"555,493,610,539",yes,here,a <b>\n2,figures/b.png,,78,,,no,,\n';
  var figLabels = { 'a.png': [{ jp: '甲', en: 'first', x: 0.1, y: 0.2 }], 'b.png': [{ en: 'held back by the flag', x: 0.1, y: 0.2 }] };
  var figRun = function (csv, labels, text, more) { return VT.figures(Object.assign({ csv: csv, texts: [{ path: 't.md', t: text || figText }], overlays: labels || figLabels }, more || {})); };
  var fg = figRun(figGood);
  eq('all agreeing: no mismatches, the records and the copies', [fg.problems, fg.items.map(function (f) { return [f.id, f.overlays, f.file, f.original || null]; }), fg.copies.length], [[], [['fig-01', true, 'figures/a.png', 'figures/raw/a.jpg'], ['fig-02', false, 'figures/b.png', null]], 3]);
  eq('a record: page, image and region as given, the note made safe for the page', [fg.items[0].page, fg.items[0].image, fg.items[0].region, fg.items[0].labelsNote], [77, '45', '555,493,610,539', 'a &lt;b&gt;']);
  var hasProblem = function (r, s) { return r.problems.some(function (p) { return p.indexOf(s) >= 0; }); };
  eq('an image line with no row', hasProblem(figRun(figHead + '1,figures/a.png,,,,,yes,,\n'), 'figures/b.png has no line'), true);
  eq('a row with no image line', hasProblem(figRun(figGood + '3,figures/c.png,,,,,no,,\n'), 'not an image line'), true);
  eq('the same name at another path', hasProblem(figRun(figHead + '1,other/a.png,,,,,yes,,\n2,figures/b.png,,,,,no,,\n'), 'the list has other/a.png'), true);
  eq('a path from the text’s own folder is the same file', VT.figures({ csv: figHead + '1,figures/a.png,,,,,no,,\n', texts: [{ path: 'text/t.md', t: VT.read('![Figure 1](../figures/a.png)\n') }], overlays: {} }).problems, []);
  eq('a file not there', hasProblem(figRun(figGood, null, null, { exists: function (p) { return p !== 'figures/raw/a.jpg'; } }), 'no original figures/raw/a.jpg'), true);
  eq('yes where the text says no', hasProblem(figRun(figHead + '1,figures/a.png,,,,,yes,,\n2,figures/b.png,,,,,yes,,\n'), '{overlays="no"} in the text'), true);
  eq('yes with no labels', hasProblem(figRun(figGood, { 'b.png': [] }), 'no labels for a.png'), true);
  eq('no, with labels, the text unmarked: the book would draw them', hasProblem(figRun(figHead + '1,figures/a.png,,,,,no,,\n2,figures/b.png,,,,,no,,\n'), 'the book would draw them'), true);
  eq('labels for no figure', hasProblem(figRun(figGood, Object.assign({ 'z.png': [{ en: 'x', x: 0, y: 0 }] }, figLabels)), 'z.png'), true);
  eq('a missing column', hasProblem(figRun('n,file\n1,figures/a.png\n'), 'no column original'), true);
  eq('an image map: the image and the region checked', [hasProblem(figRun(figGood, null, null, { images: {} }), 'no image 45'), hasProblem(figRun(figGood, null, null, { images: { 45: { w: 1000, h: 500 } } }), 'runs outside'), figRun(figGood, null, null, { images: { 45: { w: 3680, h: 2624 } } }).problems], [true, true, []]);
})();
