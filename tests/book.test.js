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
  eq('a change in no stage, or none, counts from the first', [[{ k: 'added', change: 'X' }], [{ k: 'added' }], [{ k: 'erased', change: 'X' }]].map(function (m) { return [at(0, m), at(1, m)]; }), [[false, true], [false, true], [true, false]]);
  eq('another hand: its addition never shown, its deletion never applied', [[{ k: 'added', hand: 'Q', change: 'A' }], [{ k: 'erased', hand: 'Q', change: 'A' }]].map(function (m) { return at(3, m, ['P']); }), [false, true]);
  eq('a mark with no hand counts with the hands the slider follows', [at(3, [{ k: 'erased', change: 'A' }], ['P']), at(3, [{ k: 'added', change: 'A' }], ['P'])], [false, true]);

  T.group('Book: setting the text');
  eq('a space between spans on different lines', K.join('the end', { s: 'of it', n: 4 }, 3), true);
  eq('none on the same line, after a space, or after a divided word', [K.join('the', { s: ' end', n: 3 }, 3), K.join('the ', { s: 'end', n: 4 }, 3), K.join('divi-', { s: 'ded', n: 4 }, 3)], [false, false, false]);
  eq('none before the first span, or for a span not in the lines', [K.join(null, { s: 'a', n: 1 }, null), K.join('a', { s: 'b' }, 1)], [false, false]);

  T.group('Book: a selection as lines');
  eq('within one span', K.selection({ n: 5, c0: 10, c1: 30, off: 2 }, { n: 5, c0: 10, c1: 30, off: 7 }), { n0: 5, n1: 5, c0: 12, c1: 17 });
  eq('across lines, to the end of a span', K.selection({ n: 5, c0: 10, c1: 30, off: 2 }, { n: 7, c0: 0, c1: 12, off: null }), { n0: 5, n1: 7, c0: 12, c1: 12 });
  eq('made backwards: the same lines', K.selection({ n: 7, c0: 0, c1: 12, off: 4 }, { n: 5, c0: 10, c1: 30, off: 2 }), { n0: 5, n1: 7, c0: 12, c1: 4 });
  eq('a span not in the lines: no selection', K.selection({ c0: 0, c1: 3, off: 0 }, { n: 2, c0: 0, c1: 3, off: 1 }), null);
})();
