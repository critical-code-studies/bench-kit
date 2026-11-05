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
  var ch = VT.changes('### readable | p. 12\nOLD: the chance\nNEW: the contingency\nSRC: 偶然\nWHY: the glossary\nORIGIN: witness W1\n\n### p. 13 | CHANGES\nOLD: a\nNEW: b\nJP: 甲\n\n## Literal problems\n- p. 14 a reading in doubt\n', 'checks/x.md');
  eq('the method’s form and the first run’s', ch.map(function (c) { return [c.target, c.page, c.kind, c.src]; }), [['readable', 12, null, '偶然'], ['readable', 13, 'CHANGES', '甲'], ['literal', 14, 'PROBLEM', '']]);
  eq('origin: a witness, with its id', VT.originOf(ch[0]), { k: 'witness', id: 'W1' });
  eq('applied, pending, both, gone', ['the contingency here', 'the chance here', 'the chance and the contingency', 'nothing'].map(function (s) { return VT.applied(ch[0], { readable: s }); }), ['applied', 'pending', 'both', 'gone']);
  eq('a NEW of two paragraphs is applied when a note is inserted between them', VT.applied({ target: 'readable', old: 'x', new: 'one\n\ntwo' }, { readable: 'one\n\na note added\n\ntwo' }), 'applied');
  T.group('Translation: the source');
  var pages = VT.ocr('=== PAGE 7\n偶然性の\n問題\n=== PAGE 8\n借然性\n', null);
  eq('OCR divided by image, its line breaks no matter', VT.search(pages, '偶然性の問題').map(function (h) { return h.img; }), [7]);
  eq('old character forms folded', VT.fold('偶然の實體'), '偶然の実体');
  eq('one character wrong, marked near', VT.search(pages, '偶然性', { fuzzy: true }).map(function (h) { return [h.img, h.near]; }), [[7, false], [8, true]]);
})();
