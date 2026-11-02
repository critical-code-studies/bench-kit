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
})();
