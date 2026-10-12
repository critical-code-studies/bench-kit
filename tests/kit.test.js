/*
 * tests/kit.test.js - checks of the kit's other pure parts, run by tests/run.js: the version
 * list (on a made-up list, and the bench's own list for consistency), references, builds (the
 * bench's first version with files, fetched), changes to the Help menu, the beam, octal, and
 * the list in a name's pop-up.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var SW = window.SW, T = window.T, eq = T.eq, yes = T.yes, L = window.SWVersionList, V = window.SWVersions;
  function ids(list) { return list.map(function (v) { return v.id; }); }

  T.group('Version list');
  var vs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }];
  var api = L({ versions: vs, src: 'S/', parent: { b: 'a', c: 'b', e: 'a' }, witness: { d: 'c' }, also: { e: ['c'] }, influence: { c: ['e'] },
                lines: [{ id: 'l1', tip: 'c' }, { id: 'l2', tip: 'd' }], extra: { X: 1 } });
  eq('a version by its id', api.byId('c').id, 'c');
  eq('an unknown id', api.byId('zz'), null);
  eq('the chain to a version', api.ancestry('c'), ['a', 'b', 'c']);
  eq('a witness stands in for what it reads', api.ancestry('d'), ['a', 'b', 'd']);
  eq('no chain to an unknown id', api.ancestry('zz'), []);
  eq('the lines of descent', api.LINES.map(function (l) { return l.ids; }), [['a', 'b', 'c'], ['a', 'b', 'd']]);
  eq('descent on each version', [vs[0].parent, vs[1].parent, vs[3].witnessOf, vs[4].also, vs[2].influence], [null, 'a', 'c', ['c'], ['e']]);
  eq('a version’s link', vs[1].url(), '#v=b');
  eq('the bench’s own fields', [api.X, api.SRC, api.findTitle(['x']), api.TRANSFORMS], [1, 'S/', 1, {}]);
  eq('a build list', L.files('d/', ['x', { src: 'y', role: 'doc' }]), [{ src: 'd/x', role: 'program' }, { src: 'd/y', role: 'doc' }]);
  T.later('the default load', function () {
    var v = { id: 'q', build: L.files('d/', ['x', { src: 'r', role: 'doc' }]) };
    return Promise.all([api.load(v, function (p) { return Promise.resolve('T:' + p); }), api.load({ id: 'n' }, null)]).then(function (r) {
      eq('the default load: the files as held', r[0].parts.map(function (p) { return [p.src, p.role, p.text]; }), [['d/x', 'program', 'T:d/x'], ['d/r', 'doc', 'T:d/r']]);
      eq('the default load: documentation not read as code', r[0].files.map(function (f) { return [f.name, f.text, f.doc]; }), [['x', 'T:d/x', false], ['r', '', true]]);
      eq('the default load: a version with no files', r[1].parts, []);
    });
  });

  T.group('The bench’s versions');
  var all = ids(V.VERSIONS), known = {};
  all.forEach(function (id) { known[id] = (known[id] || 0) + 1; });
  eq('every id once', all.filter(function (id) { return known[id] > 1; }), []);
  var dangling = [];
  V.VERSIONS.forEach(function (v) {
    [v.parent, v.witnessOf].concat(v.also || [], v.influence || []).forEach(function (r) { if (r && !known[r]) dangling.push(v.id + '→' + r); });
  });
  eq('descent names only versions there are', dangling, []);
  var broken = V.VERSIONS.filter(function (v) { var c = V.ancestry(v.id); return c[c.length - 1] !== v.id || V.byId(c[0]).parent; });
  eq('every chain begins at a first version and ends at its own', ids(broken), []);
  eq('every line of descent reaches its tip', V.LINES.filter(function (l) { return !l.ids.length || l.ids[l.ids.length - 1] !== l.tip; }).map(function (l) { return l.id; }), []);
  eq('every file named', V.VERSIONS.filter(function (v) { return (v.build || []).some(function (b) { return !(b.src || b.tape); }); }).map(function (v) { return v.id; }), []);
  if (SW.refOf) {
    var refs = {}, twice = [];
    V.VERSIONS.forEach(function (v) { var r = SW.refOf(v.id); if (!r) twice.push(v.id + ': none'); else if (refs[r]) twice.push(r); refs[r] = 1; });
    eq('each version cited by a reference of its own', twice, []);
  }

  T.group('Builds');
  var first = V.VERSIONS.filter(function (v) { return v.build && v.build.length; })[0];
  if (first) {
    // the sources are named relative to the bench's page, a folder above this one
    if (!/^(https?:)?\//.test(V.SRC)) V.SRC = '../' + V.SRC;
    yes('built once and kept', SW.build(first.id) === SW.build(first.id));
    T.later('a build', function () {
      return SW.build(first.id).then(function (b) {
        eq('a build: its version', b.v.id, first.id);
        eq('a build: a part and lines for each file', [b.parts.length, b.lines.length], [first.build.length, first.build.length]);
        yes('a build: timed', typeof b.ms === 'number');
        var m = SW.docMeta(b);
        eq('a build: an export’s details begin with the version and end with when it was made', [m[0][0], m[m.length - 1][0]], ['Version', 'Generated']);
      });
    });
  }
  T.later('an unknown version', function () {
    return SW.build('no-such-version').then(function () { eq('an unknown version is refused', 'built', 'refused'); },
      function () { yes('an unknown version is refused', true); });
  });
  eq('octal', [SW.oct(8), SW.oct(8, 2), SW.oct(null), SW.oct(-1, 6)], ['000010', '10', '', '37777777777']);

  T.group('Help menu');
  var keep = SW.BENCH.menus;
  function picks(G) { return G.map(function (g) { return [g[0], g[1].map(function (h) { return h[0]; })]; }); }
  SW.BENCH.menus = { help: { text: { tour: 'X' }, add: [['Your bench', ['new', 'New', 'n']], ['refs', 'join'], ['code', ['z', 'Z', 'z']]], drop: ['issue'] } };
  var G = SW.helpList(), flat = [].concat.apply([], G.map(function (g) { return g[1]; }));
  eq('a line changed', flat.filter(function (h) { return h[0] === 'tour'; })[0][2], 'X');
  eq('an item first in a group', G.filter(function (g) { return g[0] === 'Your bench'; })[0][1][0][0], 'new');
  var order = flat.map(function (h) { return h[0]; });
  eq('an item moved', order[order.indexOf('refs') + 1], 'join');
  eq('an item added after another', order[order.indexOf('code') + 1], 'z');
  yes('an item left out', order.indexOf('issue') < 0);
  SW.BENCH.menus = { help: [['Only', [['a', 'A', 'a']]]] };
  eq('a whole list kept as given', picks(SW.helpList()), [['Only', ['a']]]);
  SW.BENCH.menus = keep;

  T.group('Beam');
  eq('the intensities', [-4, -1, 0, 3].map(SW.beam), [0, 0.34, 0.62, 1]);
  eq('out of range, and none', [SW.beam(9), SW.beam(-9), SW.beam(null)], [1, 0, 0.62]);

  T.group('A name’s pop-up');
  var b = { lines: [[{ raw: '  foo bar  ' }, { raw: 'baz' }]], parts: [{ src: 'd/f.x' }] }, s = { defs: [{ file: 0, line: 1 }], refs: [{ file: 0, line: 2 }] };
  var h = SW.symbolRefs(b, s);
  yes('where it is defined, and used', h.indexOf('◆ 1  foo bar') > 0 && h.indexOf('· 2  baz') > 0);
  yes('with the file named', SW.symbolRefs(b, s, { file: true }).indexOf('f.x:1') > 0);
  yes('links to the lines', /data-p="0" data-n="2"/.test(h));
})();
