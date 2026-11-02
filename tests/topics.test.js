/*
 * tests/topics.test.js - checks of the menu switches (SW.BENCH.menusOff, kit/menus.js) and of
 * kit/topics.js's pure parts, run by tests/run.js: which menus and items are off, a menu pruned of
 * them and of what they leave empty, Help ▾ without an item, and a model file's settings as rows.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, eq = T.eq, yes = T.yes, SW = window.SW, B = SW.BENCH;
  var was = B.menusOff;
  B.menusOff = ['topics', 'help:sitemap', 'help:join', 'help:anno', 'help:codes', 'help:paratexts', 'help:implementations', 'text:6', 'file:backup'];
  T.group('Menus turned off');
  eq('a menu off', SW.menuOff('topics'), true);
  eq('a menu on', SW.menuOff('help'), false);
  eq('an item off', SW.menuOff('help', 'sitemap'), true);
  eq('an item off by its number', SW.menuOff('text', 6), true);
  eq('the same pick in another menu is on', SW.menuOff('versions', 'sitemap'), false);
  var help = SW.helpList(), picks = help.reduce(function (a, g) { return a.concat(g[1].map(function (h) { return h[0]; })); }, []);
  eq('Help ▾ without an item turned off', picks.indexOf('sitemap'), -1);
  eq('Help ▾: a group whose items are all off goes', help.some(function (g) { return g[0] === 'Annotating and sharing'; }), false);
  var el = document.createElement('div');
  el.innerHTML = '<button data-pick="a"></button><hr class="menu-rule"><div class="menu-group">Group</div><button data-pick="backup"></button>' +
    '<hr class="menu-rule"><button data-pick="b"></button>' +
    '<div class="menu-sub"><button class="menu-subopen"></button><div class="menu-subbody"><button data-pick="backup"></button></div></div>';
  SW.menuPrune(el, 'file');
  eq('pruned: the item off gone', el.querySelectorAll('[data-pick="backup"]').length, 0);
  eq('pruned: its empty group heading and submenu gone', [el.querySelectorAll('.menu-group').length, el.querySelectorAll('.menu-sub').length], [0, 0]);
  eq('pruned: one rule left between the items kept', el.querySelectorAll('hr').length, 1);
  var lens = document.createElement('div');
  lens.innerHTML = '<div class="lens-g"><h5>Words</h5><button data-l="6"></button></div><div class="lens-g"><h5>More</h5><button data-l="7"></button></div>';
  SW.menuPrune(lens, 'text');
  eq('a lens menu: the lens off and its group gone, the other kept', [lens.querySelectorAll('[data-l]').length, lens.querySelectorAll('.lens-g').length], [1, 1]);
  B.menusOff = was;

  T.group('Topics: a model file');
  var m = { kind: 'bench-kit-topics', id: 'M-3f9a2c', engine: 'mallette 0.2.0',
    settings: { k: 8, seed: 1, iterations: 1000, alphaSum: 5, beta: 0.01, optimizeInterval: 20, burnin: 200, documents: '400-word chunks within chapters', stopwords: 'the bench\'s', minLength: 3, minCount: 2 },
    documents: [{ id: 'd1' }, { id: 'd2' }] };
  var rows = SW.topics.summary(m), get = function (k) { var r = rows.filter(function (x) { return x[0] === k; })[0]; return r && r[1]; };
  eq('its id and engine', [get('Id'), get('Engine')], ['M-3f9a2c', 'mallette 0.2.0']);
  eq('its topics and documents', [get('Topics'), get('Documents')], ['8', '2']);
  eq('its optimisation', get('Optimised every'), '20 iterations, after 200');
  eq('the words left out', get('Words left out'), 'stopwords: the bench\'s; shorter than 3 letters; fewer than 2 occurrences');
  eq('settings it does not give are not shown', SW.topics.summary({ kind: 'bench-kit-topics', id: 'x' }).map(function (r) { return r[0]; }), ['Id']);
  T.later('Topics: a model the bench does not publish', function () {
    return SW.topics.model('no-such-model').then(function () { throw new Error('a model was given'); }, function (e) { if (!/No model/.test(e.message)) throw e; });
  });
})();
