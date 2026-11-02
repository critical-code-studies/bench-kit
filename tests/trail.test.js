/*
 * tests/trail.test.js - checks of the way back (SW.trail, kit/base.js) and a lens's own state
 * (SW.lenses.state, kit/lenses.js), run by tests/run.js: a choice made quietly, the place named,
 * and a lens's state taken when it is left.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, eq = T.eq, yes = T.yes, SW = window.SW;
  T.group('The way back');
  eq('quietly gives back what it runs', SW.trail.quietly(function () { return 7; }), 7);
  eq('quietly nests', SW.trail.quietly(function () { return SW.trail.quietly(function () { return 'in'; }); }), 'in');
  yes('the place open is named', typeof SW.trail.here() === 'string' && SW.trail.here().length > 0);
  yes('no ← Back where the page was not reached by a jump', !(history.state && history.state.back) === !document.getElementById('trail-back'));
  if (SW.lenses && SW.lenses.state) {
    var n = SW.anLens ? SW.anLens() : 1, got = null;
    SW.lenses.state(n, function () { return 'src:chapters,step:20'; }, function (s) { got = s; });
    eq('a lens left: its state taken', SW.lenses.capture(), { n: n, s: 'src:chapters,step:20' });
    SW.lenses.state(n, null, null);
  }

  T.group('Read keeps its place');
  if (SW.readPlace) {
    var keepPlaces = SW.store.get('read.places', null);
    SW.readPlace.set('test-a', 2, 40); SW.readPlace.set('test-b', 0, 7);
    eq('a version\'s place kept and read back', [SW.readPlace.get('test-a'), SW.readPlace.get('test-b')], [{ p: 2, n: 40 }, { p: 0, n: 7 }]);
    SW.readPlace.set('test-a', 3, 1);
    eq('kept again, the newer place', SW.readPlace.get('test-a'), { p: 3, n: 1 });
    eq('a version never read has none', SW.readPlace.get('test-none'), null);
    for (var i = 0; i < 40; i++) SW.readPlace.set('test-' + i, 0, i);
    eq('at most thirty versions kept, the oldest dropped first', [Object.keys(SW.store.get('read.places', {})).length, SW.readPlace.get('test-a'), SW.readPlace.get('test-39')], [30, null, { p: 0, n: 39 }]);
    SW.store.set('read.places', keepPlaces);
  }
  var was = SW.state.at, wasTab = SW.state.tab, wasSel = SW.state.sel;
  SW.state.at = { p: 1, n: 12 }; SW.state.sel = null; SW.state.tab = 'read';
  var q = (function () { var h = location.href; SW.writeQuery(); var out = location.search; history.replaceState(history.state, '', h); return out; })();
  eq('the address carries the line at the top of Read', /[?&]at=1%3A12(&|$)/.test(q), true);
  SW.state.at = was; SW.state.tab = wasTab; SW.state.sel = wasSel;

  T.group('Open a version');
  if (SW.openVersion && root0().SWVersions) {
    SW.openVersion();
    var dlg = document.getElementById('dlg-open');
    eq('the box opens, titled as it is', [!!(dlg && dlg.open), dlg && dlg.querySelector('h2').textContent], [true, 'Open a version']);
    yes('its folders begin with Recent, then the groups', dlg && dlg.querySelector('.ov-folder').textContent.indexOf('Recent') >= 0 && dlg.querySelectorAll('.ov-folder').length >= 2);
    if (dlg) dlg.close();
  }
  function root0() { return window; }
})();
