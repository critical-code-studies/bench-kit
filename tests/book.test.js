/*
 * tests/book.test.js - checks of kit/book.js's pure parts, run by tests/run.js, on an invented
 * document: which revisions a stage shows (additions, deletions, a deletion reinstated, a change in
 * no stage, hands the slider leaves to All revisions), the space between two spans, and a
 * selection read back as lines and characters.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, eq = T.eq, K = window.SW.book;
  var AT = K.stageMap([{ id: 'A' }, { id: 'B' }, { id: 'C' }]);
  function at(s, marks, hands) { return K.shownAt(marks, s, AT, hands || null); }

  T.group('Book: stages');
  eq('the stages in order', AT, { A: 1, B: 2, C: 3 });
  eq('a span with no marks is there at every stage', [0, 1, 2, 3].map(function (s) { return at(s, []); }), [true, true, true, true]);
  eq('an addition at B: out before revision and at A, in from B', [0, 1, 2, 3].map(function (s) { return at(s, [{ k: 'added', change: 'B' }]); }), [false, false, true, true]);
  eq('a deletion at B: in before revision and at A, out from B', [0, 1, 2, 3].map(function (s) { return at(s, [{ k: 'erased', change: 'B' }]); }), [true, true, false, false]);
  eq('added at A and deleted at C: in at A and B only', [0, 1, 2, 3].map(function (s) { return at(s, [{ k: 'added', change: 'A' }, { k: 'erased', change: 'C' }]); }), [false, true, true, false]);
  eq('deleted at A, reinstated at C: out at A and B, back at C', [0, 1, 2, 3].map(function (s) { return at(s, [{ k: 'reinstated', change: 'C' }, { k: 'erased', change: 'A' }]); }), [true, false, false, true]);
  eq('a phrase deleted at B and reinstated at C: a word replaced inside it at A stays out', [0, 1, 2, 3].map(function (s) { return at(s, [{ k: 'reinstated', change: 'C' }, { k: 'erased', change: 'B' }, { k: 'erased', change: 'A' }]); }), [true, false, false, false]);
  eq('a change in no stage, or none, counts from the first', [[{ k: 'added', change: 'X' }], [{ k: 'added' }], [{ k: 'erased', change: 'X' }]].map(function (m) { return [at(0, m), at(1, m)]; }), [[false, true], [false, true], [true, false]]);
  eq('another hand: its addition never shown, its deletion never applied', [[{ k: 'added', hand: 'Q', change: 'A' }], [{ k: 'erased', hand: 'Q', change: 'A' }]].map(function (m) { return at(3, m, ['P']); }), [false, true]);
  eq('a mark with no hand counts with the hands the slider follows', [at(3, [{ k: 'erased', change: 'A' }], ['P']), at(3, [{ k: 'added', change: 'A' }], ['P'])], [false, true]);

  T.group('Book: deletions struck');
  function sk(s, marks) { var r = K.struckAt(marks, s, AT, null); return r.on ? (r.struck ? 'struck' : 'in') : 'out'; }
  eq('a deletion at B: in, then struck from B', [0, 1, 2, 3].map(function (s) { return sk(s, [{ k: 'erased', change: 'B' }]); }), ['in', 'in', 'struck', 'struck']);
  eq('an addition at A deleted at C: out, in, in, struck', [0, 1, 2, 3].map(function (s) { return sk(s, [{ k: 'added', change: 'A' }, { k: 'erased', change: 'C' }]); }), ['out', 'in', 'in', 'struck']);
  eq('deleted at A, reinstated at C: plain again at C', [1, 2, 3].map(function (s) { return sk(s, [{ k: 'reinstated', change: 'C' }, { k: 'erased', change: 'A' }]); }), ['struck', 'struck', 'in']);
  eq('the revisions of a stage: made at that stage only', [0, 1, 2, 3].map(function (s) { return K.madeAt([{ k: 'added', change: 'B' }], s, AT, null); }), [false, false, true, false]);

  T.group('Book: setting the text');
  eq('a space between spans on different lines', K.join('the end', { s: 'of it', n: 4 }, 3), true);
  eq('none on the same line, after a space, or after a divided word', [K.join('the', { s: ' end', n: 3 }, 3), K.join('the ', { s: 'end', n: 4 }, 3), K.join('divi-', { s: 'ded', n: 4 }, 3)], [false, false, false]);
  eq('none before the first span, or for a span not in the lines', [K.join(null, { s: 'a', n: 1 }, null), K.join('a', { s: 'b' }, 1)], [false, false]);

  T.group('Book: a selection as lines');
  eq('within one span', K.selection({ n: 5, c0: 10, c1: 30, off: 2 }, { n: 5, c0: 10, c1: 30, off: 7 }), { n0: 5, n1: 5, c0: 12, c1: 17 });
  eq('across lines, to the end of a span', K.selection({ n: 5, c0: 10, c1: 30, off: 2 }, { n: 7, c0: 0, c1: 12, off: null }), { n0: 5, n1: 7, c0: 12, c1: 12 });
  eq('made backwards: the same lines', K.selection({ n: 7, c0: 0, c1: 12, off: 4 }, { n: 5, c0: 10, c1: 30, off: 2 }), { n0: 5, n1: 7, c0: 12, c1: 4 });
  eq('a span not in the lines: no selection', K.selection({ c0: 0, c1: 3, off: 0 }, { n: 2, c0: 0, c1: 3, off: 1 }), null);

  T.group('Book: opened from elsewhere');
  T.group('Book: the citation sent with a highlight');
  (function () {
    var o = { page: '81', version: 'translation', label: 'Translation', cite: 'Translation (2026), file.md, l. 394' };
    eq('with no wording of the bench’s, the reference by file and line', K.shareCite(undefined, o), 'Translation (2026), file.md, l. 394');
    eq('a text with {page} in it', K.shareCite('Kuki, *The Problem of Contingency*, p. {page} of the 1948 printing ({label}).', o), 'Kuki, The Problem of Contingency, p. 81 of the 1948 printing (Translation).');
    eq('a function of the page and the version', K.shareCite(function (x) { return x.version === 'translation' ? 'p. ' + x.page : null; }, o), 'p. 81');
    eq('a function that gives nothing keeps the reference', K.shareCite(function () { return null; }, o), o.cite);
    eq('a function that fails keeps the reference', K.shareCite(function () { throw new Error('x'); }, o), o.cite);
    T.group('Book: a page by its name');
    var pn = ['i', 'ii', '1', '2', '81', '330', '331'], mn = ['img_7', 'img_8', 'f. 12r', 'Cover'];
    eq('the name as typed', K.findPage(pn, ' 81 '), '81');
    eq('with p. or page before it', [K.findPage(pn, 'p. 81'), K.findPage(pn, 'page 330'), K.findPage(pn, 'P.2'), K.findPage(pn, 'p81'), K.findPage(pn, 'p. ii')].join(' '), '81 330 2 81 ii');
    eq('a roman numeral, and a name without its case', [K.findPage(pn, 'II'), K.findPage(mn, 'cover')].join(' '), 'ii Cover');
    eq('zeros before a number', K.findPage(pn, '081'), '81');
    eq('the one page whose name has the number', [K.findPage(mn, '7'), K.findPage(mn, '12')].join(' '), 'img_7 f. 12r');
    eq('a page that is not there, and nothing typed', [K.findPage(pn, '400'), K.findPage(pn, ''), K.findPage(pn, 'p.'), K.findPage(pn, 'pages')].map(String).join(' '), 'null null null null');
    eq('a number two pages share names neither', K.findPage(['f. 3r', 'f. 3v'], '3'), null);
    T.group('Book: the texts with a chip');
    var tl = ['translation', 'literal', 'ocr'];
    eq('every text, where the bench names none', K.chips(tl, 'translation').join(' '), 'translation literal ocr');
    eq('no row, where the bench wants none', K.chips(tl, 'literal', false).length, 0);
    eq('the texts named, in the list\'s order', K.chips(tl, 'translation', ['ocr', 'translation']).join(' '), 'translation ocr');
    eq('the text open with them, where it is not one of them', K.chips(tl, 'literal', ['translation']).join(' '), 'translation literal');
    eq('no row for the open text alone', K.chips(tl, 'translation', ['translation']).length, 0);
    T.group('Book: footnotes');
    var call = function (id) { return { s: '', marks: [{ k: 'ref', note: id }] }; }, w = { s: 'words', marks: [] };
    var nb = [{ t: 'head', level: 2, spans: [w] }, { t: 'p', spans: [w, call('i1-6'), w, call('i1-1')] }, { t: 'note', id: 'i1-6', spans: [call('i1-6'), w] },
              { t: 'head', level: 3, spans: [w] }, { t: 'p', spans: [call('i1-2'), call('i1-6'), call('none'), { s: 'a word', marks: [{ k: 'ref', note: 'w' }] }] },
              { t: 'head', level: 2, spans: [w] }, { t: 'p', spans: [call('c1-9')] }];
    var known = { 'i1-6': 1, 'i1-1': 1, 'i1-2': 1, 'c1-9': 1, w: 1 };
    eq('notes are numbered in the order they are first called, whatever their labels', JSON.stringify(K.noteNumbers(nb, null, known)), '{"i1-6":1,"i1-1":2,"i1-2":3,"c1-9":4}');
    eq('from 1 again at each heading of the level given or above', JSON.stringify(K.noteNumbers(nb, 2, known)), '{"i1-6":1,"i1-1":2,"i1-2":3,"c1-9":1}');
    var ns = [{ s: '', marks: [{ k: 'ref', note: 'i1-2' }] }, { s: ': Tr. 形而上 (', marks: [] }, { s: 'keijijō', marks: [{ k: 'hi', rend: 'italic' }] }, { s: '), <above> & ', marks: [] }, { s: '', marks: [{ k: 'ref', note: 'i1-3' }] }, { s: 'form', marks: [{ k: 'hi', rend: 'bold' }] }];
    eq('a note without its own label and colon, italic and bold kept, markup escaped', K.noteHTML(ns, 'i1-2'), 'Tr. 形而上 (<i>keijijō</i>), &lt;above&gt; &amp; <b>form</b>');
    eq('a note that does not begin with its label keeps its first words', K.noteHTML([{ s: ' : a colon of its own', marks: [] }], 'x'), ': a colon of its own');
  })();
  T.group('Book: a place’s words found in the text');
  eq('whitespace and * are passed over', K.squash(' the *hasard* of\n chance '), 'thehasardofchance');
  (function () {
    var hay = K.squash('It is so. Why is it so? It is so. The end.'), q = K.squash('It is so.');
    eq('a quote is found where it first lies', K.findQuote(hay, q, 0), [0, 7]);
    eq('from a place on, the next', K.findQuote(hay, q, 1), [17, 24]);
    eq('one that ends before the page’s own text is passed over', K.findQuote(hay, q, 0, 8, hay.length), [17, 24]);
    eq('one that begins after the page’s own text is not taken', K.findQuote(hay, q, 1, 0, 10), null);
    eq('a passage that crosses into the page counts', K.findQuote(hay, K.squash('Why is it so?'), 0, 12, hay.length), [7, 17]);
    eq('words not in the text: null', K.findQuote(hay, K.squash('Not here.'), 0), null);
    eq('no words: null', K.findQuote(hay, '', 0), null);
  })();
  eq('SW.book.openAt is there for any bench', typeof (window.SW.book || {}).openAt, 'function');
})();
