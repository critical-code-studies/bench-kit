/*
 * topics.js - the Topics tab: topic models of a bench's texts, as SW.topics. A bench that sets
 * SW.BENCH.topics and loads this file (after kit/lenses.js, before kit/shell.js) has the tab; the
 * kit puts its button in the tab row (after Book, or after the lens menus) and its section in the
 * page where the bench has not, and adds 'topics' to the shell's views. menusOff: ['topics']
 * leaves it out. The plan it follows is the kit's proposal for topic modelling on mallette, a
 * JavaScript translation of MALLET's topic model.
 *
 *   SW.BENCH.topics   { models: [{ id, name, url, note }] }: the models the bench publishes, each a
 *                     model file ({ kind: 'bench-kit-topics', id, engine, settings, documents,
 *                     topics, … }) at url; name and note are the bench's words for it
 *
 * The tab's parts, each numbered as the lenses are:
 *   1  Models        the bench's published models: each one's name, id, engine, settings and
 *                    documents, read from its file
 * The others (the topics, documents and topics, a topic through the text, a word's and a document's
 * topics, a selection's, across versions and stages, steadiness across seeds) and models run in
 * the page come with the kit's topics engine.
 *
 *   SW.topics.model(id)   a promise of a published model's file
 *   SW.topics.summary(m)  a model file's settings as [label, value] rows
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH, C = B.topics, esc = SW.esc;
  var T = SW.topics = SW.topics || {};

  // a model file's settings, as rows to show
  T.summary = function (m) {
    var s = m.settings || {}, rows = [];
    function add(label, v) { if (v != null && v !== '') rows.push([label, String(v)]); }
    add('Id', m.id);
    add('Engine', m.engine);
    add('Topics', s.k != null ? s.k : (m.topics || []).length || null);
    add('Documents', (m.documents || []).length || null);
    add('Seed', s.seed);
    add('Iterations', s.iterations);
    add('Alpha (sum), beta', s.alphaSum != null || s.beta != null ? [s.alphaSum, s.beta].filter(function (x) { return x != null; }).join(', ') : null);
    add('Optimised every', s.optimizeInterval ? s.optimizeInterval + ' iterations, after ' + (s.burnin != null ? s.burnin : 200) : s.optimizeInterval === 0 ? 'not optimised' : null);
    add('Documents made by', s.documents);
    add('Words left out', [s.stopwords ? 'stopwords: ' + s.stopwords : '', s.minLength ? 'shorter than ' + s.minLength + ' letters' : '', s.minCount ? 'fewer than ' + s.minCount + ' occurrences' : ''].filter(Boolean).join('; ') || null);
    return rows;
  };
  var cache = {};
  T.model = function (id) {
    var M = ((C || {}).models || []).filter(function (x) { return x.id === id; })[0];
    if (!M) return Promise.reject(new Error('No model ' + id + ' in this bench.'));
    return cache[id] || (cache[id] = fetch(M.url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('Its file, ' + M.url + ', could not be read (' + r.status + ').');
      return r.json();
    }).then(function (m) {
      if (!m || m.kind !== 'bench-kit-topics') throw new Error(M.url + ' is not a topic model file.');
      return m;
    }));
  };

  if (!C || (SW.menuOff && SW.menuOff('topics')) || !SW.views) return;

  // the tab, its section, and its place among the shell's views, where the bench has not given them
  var tabs = SW.$('#tabs');
  if (tabs && !SW.$('[data-tab="topics"]', tabs)) {
    var btn = SW.el('button', { 'data-tab': 'topics', title: 'Topic models of the texts: the topics, and where they fall' }, esc(C.label || 'Topics'));
    var after = SW.$('[data-tab="book"]', tabs) || SW.$$('[data-tabs~="analyse"]', tabs).pop();
    var before = after ? after.nextSibling : SW.$('[data-menu="versions"], [data-menu="help"]', tabs);
    tabs.insertBefore(btn, before || null);
  }
  var main = SW.$('#view-read') && SW.$('#view-read').parentNode;
  if (main && !SW.$('#view-topics')) main.appendChild(SW.el('section', { class: 'view', id: 'view-topics' }));
  B.shell = B.shell || {};
  if (!B.shell.views) B.shell.views = ['read'];
  if (B.shell.views.indexOf('topics') < 0) B.shell.views.push('topics');

  var PARTS = [[1, 'Models', 'The models the bench publishes']];
  var part = 1;
  function draw() {
    var view = SW.$('#view-topics'); if (!view) return;
    view.innerHTML = '';
    var pad = SW.el('div', { class: 'pad', style: 'max-width:none' });
    var head = SW.el('div', { class: 'toolbar an-head', style: 'position:static;padding:0 0 10px' });
    head.innerHTML = '<b class="an-title">' + esc(C.label || 'Topics') + '</b>' +
      (PARTS.length > 1 ? '<span class="seg-btns">' + PARTS.map(function (p) { return '<button class="btn' + (p[0] === part ? ' on' : '') + '" data-tp="' + p[0] + '">' + esc(p[1]) + '</button>'; }).join('') + '</span>' : '') +
      '<span class="hint an-desc">' + esc(PARTS.filter(function (p) { return p[0] === part; })[0][2]) + '.</span>';
    head.addEventListener('click', function (e) { var t = e.target.closest('[data-tp]'); if (t) { part = +t.dataset.tp; draw(); } });
    var cards = SW.el('div', { class: 'cards' });
    pad.appendChild(head); pad.appendChild(cards); view.appendChild(pad);
    if (part === 1) models(cards);
  }
  function models(cards) {
    var list = C.models || [];
    if (!list.length) { cards.appendChild(SW.el('p', { class: 'hint' }, 'This bench publishes no topic models yet.')); return; }
    list.forEach(function (M) {
      var c = SW.lenses ? SW.lenses.card(M.name || M.id, M.note ? esc(M.note) : '') : SW.el('div', { class: 'card' }, '<h3>' + esc(M.name || M.id) + '</h3>');
      var body = SW.el('p', { class: 'hint' }, 'Reading the model…');
      c.appendChild(body); cards.appendChild(c);
      T.model(M.id).then(function (m) {
        var t = SW.el('table', { class: 'tp-sum' });
        t.innerHTML = T.summary(m).map(function (r) { return '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('');
        body.replaceWith(t);
      }, function (e) { body.textContent = e.message; });
    });
  }
  SW.views.topics = { show: draw };
})(typeof window !== 'undefined' ? window : globalThis);
