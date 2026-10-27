/*
 * tests/mending.test.js - checks of kit/mending.js's pure parts, run by tests/run.js: a file's text
 * with its repairs applied (lines replaced, more or fewer, the line ends kept), and what stops a
 * repair being kept.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, eq = T.eq, M = window.SW.mending;
  T.group('Repairs: applied');
  var held = 'a\nb\nc\nd\ne';
  eq('one line read otherwise', M.apply(held, [{ n0: 2, n1: 2, text: 'B' }]), 'a\nB\nc\nd\ne');
  eq('two lines read as three, and another below them', M.apply(held, [{ n0: 2, n1: 3, text: 'x\ny\nz' }, { n0: 5, n1: 5, text: 'E' }]), 'a\nx\ny\nz\nd\nE');
  eq('the held file\'s line ends kept', M.apply('a\r\nb\r\nc', [{ n0: 3, n1: 3, text: 'C' }]), 'a\r\nb\r\nC');
  eq('no repairs: the text as held', M.apply(held, []), held);
  T.group('Repairs: what is kept');
  var ok = { p: 0, n0: 2, n1: 2, held: 'b', text: 'B', mend: 'hibi', why: 'Another copy reads B.' };
  function why(c, others) { return M.check(Object.assign({}, ok, c), others); }
  eq('a documented repair is kept', why({}), '');
  eq('a reading the same as the held text is refused', /same as the held/.test(why({ text: 'b' })), true);
  eq('a repair without why is refused', /Say why/.test(why({ why: ' ' })), true);
  eq('a mend not in the register is refused', /kind of mend/.test(why({ mend: 'glue' })), true);
  eq('lines another repair already covers are refused', /overlap/.test(why({}, [{ p: 0, n0: 1, n1: 2 }])), true);
  eq('the same lines in another file are not', why({}, [{ p: 1, n0: 1, n1: 2 }]), '');
})();
