/*
 * tests/builder.test.js - checks of what kit/builder.js fills in from the files given, run by
 * tests/run.js: a folder's name, one file's, what several share, and a year taken to the date.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, eq = T.eq, S = window.SW.builderSuggest;
  if (!S) return;
  T.group('Builder: from the files given');
  eq('one file: its name, without the extension', S(['wordfreq.py']), { id: 'wordfreq', label: 'wordfreq', date: '' });
  eq('a year in the name goes to the date', S(['ELIZA-1965b.mad']), { id: 'eliza', label: 'ELIZA-1965b', date: '1965' });
  eq('a folder dropped: its name', S(['a.s', 'b.s'], 'spacewar-1962'), { id: 'spacewar', label: 'spacewar-1962', date: '1962' });
  eq('what several files share', S(['comanche055-part1.agc', 'comanche055-part2.agc']), { id: 'comanche055-part', label: 'comanche055-part', date: '' });
  eq('nothing shared: the first program\'s name', S(['README.md', 'ELIZA-1965b.mad', 'DOCTOR.txt']), { id: 'eliza', label: 'ELIZA-1965b', date: '1965' });
  eq('no files: nothing', S([]), { id: '', label: '', date: '' });
})();
