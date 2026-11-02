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
  eq('-ed, a doubled consonant undone', has('stop', 'stopped'), true);
  eq('-d after e', has('glance', 'glanced'), true);
  eq('-ing, with e put back', has('make', 'making'), true);
  eq('archaic -eth', has('walk', 'walketh'), true);
  eq('archaic -est', has('know', 'knowest'), true);
  eq("'s, curly or straight", has('captain', 'Captain’s'), true);
  eq('no lemma under three letters', has('wa', 'was'), false);
  eq('nothing for no letters', D.forms('—'), []);
  T.group('Dictionary: shards and finding');
  eq('two first letters', D.shardOf('Mizzen'), 'mi');
  eq('a one-letter word in _', D.shardOf('a'), '_');
  var toy = { sally: [{ head: 'sally', pos: 'v. i.', senses: ['To leap or rush out.'] }], mizzen: [{ head: 'mizzen', pos: 'a.', field: ['Naut'], senses: ['Hindmost.'] }] };
  function get(w) { return Object.prototype.hasOwnProperty.call(toy, w) ? toy[w] : null; }
  eq('as written', D.find(get, 'mizzen').how, 'as written');
  eq('by a lemma, and from what', [D.find(get, 'sallies').as, D.find(get, 'sallies').how], ['sally', 'from sallies']);
  eq('not there', D.find(get, 'hawser'), null);
  eq('a shard not loaded is not known', D.find(function () { return undefined; }, 'mizzen', true), undefined);
})();
