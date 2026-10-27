/*
 * tests/project.test.js - checks of kit/project.js's pure parts, run by tests/run.js: values at
 * dotted paths, the user's settings laid over config.js, fields shown and read back, and what
 * stops a change to a locked GitHub location being saved.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, eq = T.eq, P = window.SW.project;

  T.group('Bench settings: paths');
  var o = { name: 'A', about: { cite: { title: 'T' } } };
  eq('a value at a path', [P.get(o, 'name'), P.get(o, 'about.cite.title'), P.get(o, 'about.x.y')], ['A', 'T', undefined]);
  P.put(o, 'about.cite.authors', 'Berry, D. M.'); P.put(o, 'paratexts.repo', 'x_paratexts');
  eq('a value put at a path, with the objects on the way', [o.about.cite, o.paratexts], [{ title: 'T', authors: 'Berry, D. M.' }, { repo: 'x_paratexts' }]);
  var B = { name: 'Old', refs: { prefix: 'O-', dir: 'source' }, comment: '#' };
  P.apply(B, { name: 'New', 'refs.prefix': 'N-', comment: ['//', ';'] });
  eq('the user\'s settings laid over config.js, the rest kept', B, { name: 'New', refs: { prefix: 'N-', dir: 'source' }, comment: ['//', ';'] });
  if (!window.SW.BENCH.editable) eq('a bench that does not say editable is left as config.js gave it', P.def('name'), undefined);

  T.group('Bench settings: fields');
  var list = { kind: 'list' }, map = { kind: 'map' }, check = { kind: 'check' }, text = {};
  eq('a list shown and read back', [P.show(list, ['//', ';']), P.read(list, ' //  ; '), P.show(list, '#'), P.read(list, '')], ['// ;', ['//', ';'], '#', []]);
  eq('short names shown one a line and read back', [P.show(map, { v1: 'SHI', v2: 'SHII' }), P.read(map, 'v1 = SHI\n v2=SHII \nbad line\nv3 =')], ['v1 = SHI\nv2 = SHII', { v1: 'SHI', v2: 'SHII' }]);
  eq('a check and a text', [P.show(check, undefined), P.read(check, true), P.show(text, null), P.read(text, '  Title ')], [false, true, '', 'Title']);

  T.group('Bench settings: the lock');
  var GH = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/, base = { label: 'Repository', pattern: GH, from: 'https://github.com/a/old', initials: 'DB' };
  function msg(c) { return P.lockMsg(Object.assign({}, base, c)); }
  eq('unchanged: nothing stops it', msg({ to: base.from }), '');
  eq('first set, with nothing there before: no second typing needed', msg({ from: '', to: 'https://github.com/a/new' }), '');
  eq('a change not typed again is stopped', /type the new value again/.test(msg({ to: 'https://github.com/a/new', again: '' })), true);
  eq('a change typed again differently is stopped', /type the new value again/.test(msg({ to: 'https://github.com/a/new', again: 'https://github.com/a/neww' })), true);
  eq('a change without initials is stopped', /initials/.test(msg({ to: 'https://github.com/a/new', again: 'https://github.com/a/new', initials: '' })), true);
  eq('a change typed twice, with initials, may be saved', msg({ to: 'https://github.com/a/new', again: 'https://github.com/a/new' }), '');
  eq('an address not in the expected form is stopped', /expected form/.test(msg({ to: 'github.com/a/new', again: 'github.com/a/new' })), true);
})();
