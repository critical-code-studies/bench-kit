/*
 * tests/dictionary.test.js - checks of kit/dictionary.js's pure parts, run by tests/run.js: the forms
 * of a word tried (lemmas, modern and archaic), the shard a word is in, and a word found in a toy
 * dictionary, with how it was reached.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, eq = T.eq, D = window.SW.dict;
  function has(form, w) { return D.forms(w).some(function (f) { return f.w === form; }); }
  T.group('Dictionary: the forms tried');
  eq('as written first, in lower case', D.forms('Sallies')[0], { w: 'sallies', how: 'as written' });
  eq('-ies to -y', has('sally', 'sallies'), true);
  eq('-ied to -y', has('carry', 'carried'), true);
  eq('-men to -man', [has('landsman', 'landsmen'), has('englishman', 'Englishmen')], [true, true]);
  eq('-ed, a doubled consonant undone', has('stop', 'stopped'), true);
  eq('-d after e', has('glance', 'glanced'), true);
  eq('-ing, with e put back', has('make', 'making'), true);
  eq('archaic -eth', has('walk', 'walketh'), true);
  eq('archaic -est', has('know', 'knowest'), true);
  eq("'s, curly or straight", has('captain', 'Captain’s'), true);
  eq('no lemma under three letters', has('wa', 'was'), false);
  eq('nothing for no letters', D.forms('—'), []);
  eq('a word that is also an object’s name', D.forms('constructor')[0], { w: 'constructor', how: 'as written' });
  T.group('Dictionary: shards and finding');
  eq('two first letters', D.shardOf('Mizzen'), 'mi');
  eq('a one-letter word in _', D.shardOf('a'), '_');
  var toy = { sally: [{ head: 'sally', pos: 'v. i.', senses: ['To leap or rush out.'] }], mizzen: [{ head: 'mizzen', pos: 'a.', field: ['Naut'], senses: ['Hindmost.'] }] };
  function get(w) { return Object.prototype.hasOwnProperty.call(toy, w) ? toy[w] : null; }
  eq('as written', D.find(get, 'mizzen').how, 'as written');
  eq('by a lemma, and from what', [D.find(get, 'sallies').as, D.find(get, 'sallies').how], ['sally', 'from sallies']);
  eq('not there', D.find(get, 'hawser'), null);
  eq('a shard not loaded is not known', D.find(function () { return undefined; }, 'mizzen', true), undefined);
  T.group('Dictionary: any language');
  eq('English as before where lang is en', D.forms('Sallies', 'en')[0], { w: 'sallies', how: 'as written' });
  eq('another spaced language: as written, normalised, no English lemmas', D.forms('Häuser,', 'de').map(function (f) { return f.w; }), ['häuser']);
  eq('an unspaced script: the run, then each prefix, longest first', D.forms('偶然性の問題', 'ja').map(function (f) { return f.w; }), ['偶然性の問題', '偶然性の問', '偶然性の', '偶然性', '偶然', '偶']);
  eq('full-width letters normalised', D.forms('ＡＢＣ', 'ja')[0].w, 'abc');
  eq('shards by first character', [D.shardOf('偶然', 'ja'), D.shardOf('あい', 'ja'), D.shardOf('', 'ja')], ['u5076', 'u3042', '_']);
  var jt = { '偶然': [{ head: '偶然', reading: 'ぐうぜん', senses: ['chance; accident'] }] };
  function jget(w) { return Object.prototype.hasOwnProperty.call(jt, w) ? jt[w] : null; }
  eq('the longest word a run begins with', [D.find(jget, '偶然性の問題', false, { lang: 'ja' }).as, D.find(jget, '偶然性の問題', false, { lang: 'ja' }).how], ['偶然', 'from 偶然性の問題']);
  eq('a bench’s own forms', D.find(jget, '偶然だ', false, { lang: 'ja', forms: function (w) { return [w, w.replace(/だ$/, '')]; } }).as, '偶然');
  T.group('Dictionary: the words of a selection');
  eq('English words, two letters or more', D.words('the captain’s cabin, a'), ['the', 'captain’s', 'cabin']);
  eq('accented words whole', D.words('café éclat'), ['café', 'éclat']);
  eq('an unspaced run as one', D.words('九鬼周造 「偶然性の問題」'), ['九鬼周造', '偶然性の問題']);
  eq('at most six', D.words('a1 bb cc dd ee ff gg hh').length, 6);
})();
