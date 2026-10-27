/*
 * tests/versions.test.js - checks of kit/versionlist.js's add and remove, run by tests/run.js, on
 * an invented list: a version made in the page put in as the bench's own are, the line of descent
 * whose tip is its parent running on to it, a line named and made, and one taken out again.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, eq = T.eq, L = window.SWVersionList;
  function list() {
    return L({ versions: [{ id: 'a', sort: 1, build: [] }, { id: 'b', sort: 2, build: [] }], src: '', parent: { b: 'a' },
               lines: [{ id: 'main', label: 'Main', tip: 'b' }] });
  }
  T.group('Versions made in the page');
  var V = list();
  V.add({ id: 'c', sort: 3, build: [] }, { parent: 'b' });
  eq('put in the list, dressed as the bench\'s own', [V.VERSIONS.length, V.byId('c').parent, typeof V.byId('c').url, V.byId('c').also], [3, 'b', 'function', []]);
  eq('the line whose tip is its parent runs on to it', V.LINES[0].ids, ['a', 'b', 'c']);
  V.add({ id: 'x', sort: 4, build: [] }, { parent: 'a', line: 'side', lineLabel: 'Side' });
  eq('a line named, made where there is none', V.LINES.map(function (l) { return l.id + ':' + l.ids.join('>'); }), ['main:a>b>c', 'side:a>x']);
  V.add({ id: 'y', sort: 5, build: [] }, { parent: 'a' });
  eq('a version from the middle of a line leaves the lines as they were', V.LINES.map(function (l) { return l.ids.join('>'); }), ['a>b>c', 'a>x']);
  var threw = ''; try { V.add({ id: 'b', build: [] }); } catch (e) { threw = e.message; }
  eq('an id the list has already is refused', threw, 'There is already a version b.');
  V.remove('c'); V.remove('x');
  eq('taken out: each line it ended runs back to its parent', [V.byId('c'), V.LINES.map(function (l) { return l.id + ':' + l.ids.join('>'); })], [null, ['main:a>b', 'side:a']]);
})();
