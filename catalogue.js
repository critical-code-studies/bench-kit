/*
 * catalogue.js - a catalogue of what is known to have existed, held here or not: a table of
 * entries with a search, filters, sorting and named subsets, each entry linked to the versions
 * the bench holds of it. For a bench whose versions are a few of many known texts (the ELIZA
 * bench's scripts, after Inventing ELIZA, Table 1.2). Everything comes from SW.BENCH.catalogue;
 * a bench without it is left as it is.
 *
 * SW.BENCH.catalogue:
 *   view     the view it is drawn in ('scripts': <section id="view-scripts">, a view in the
 *            bench's shell.views)
 *   store    the prefix of its keys in the browser's storage
 *   title, intro, foot   HTML above and below the table; intro may be a function (cat) -> HTML
 *   noun     what an entry is called ('script'), for the search's placeholder and "none match"
 *   rows     the entries: objects with the fields the columns read; key, the field that names an
 *            entry (n); held, the field listing the versions held of it ([version ids])
 *   columns  [{ key, label, sort (true, or a function (a, b)), cls, html(row) }]; html by default
 *            the field as text, or a dash
 *   search(row)  the text a search looks in (every column's field, by default)
 *   facets   [{ id, label, kind ('seg' buttons or 'select'), options [[value, label]], test(row,
 *            value) }]: filters; the first option, value '', is all
 *   source   { label, test(row), yes, no, title }: a column and a filter for whether an entry is in
 *            the source the catalogue follows (ELIZA's: IE, Inventing ELIZA's Table 1.2)
 *   heldLabel(row, v)  a held version's button text (its label, by default)
 *   extra(row)  HTML after the buttons (links of the bench's own; data-cat-open="version id"
 *            opens a version's record)
 *   subsets  [{ id, label, short, rows ([keys]) or test(row), versions ([ids], date order), line
 *            (a line of descent for the genealogy's flow), note }]; the first, id '', is all
 * SW.catalogue: rows, subsets.list, subsets.current(), subsets.set(id) (filters the table, and
 *   turns the flow to the subset's line), render().
 */
(function (root) {
  'use strict';

  var SW = root.SW, C = SW.BENCH.catalogue, esc = SW.esc;
  if (!C || !C.rows) return;
  var view = SW.$('#view-' + (C.view || 'catalogue'));
  if (!view) return;
  var V = root.SWVersions, KEY = C.key || 'n', HELD = C.held || 'held', NOUN = C.noun || 'entry';
  var COLS = C.columns || [], FACETS = C.facets || [], SUBS = C.subsets && C.subsets.length ? C.subsets : [{ id: '', label: 'All', short: 'All' }];
  var store = function (k, v) { try { if (arguments.length > 1) SW.store.set((C.store || 'catalogue') + '.' + k, v); else return SW.store.get((C.store || 'catalogue') + '.' + k); } catch (e) { /* storage closed */ } };

  // ---------- subsets ----------
  function subById(id) { return SUBS.filter(function (x) { return x.id === id; })[0] || SUBS[0]; }
  function inSub(sub, r) { return !sub.id || (sub.test ? sub.test(r) : (sub.rows || []).indexOf(r[KEY]) >= 0); }
  var subId = store('subset') || '';
  var subsets = {
    list: SUBS,
    current: function () { return subById(subId); },
    set: function (id) {
      subId = subById(id).id; store('subset', subId);
      var sub = subById(subId);
      if (sub.line && SW.genealogyLine) SW.genealogyLine(sub.line);
      if (SW.state.tab === C.view) render();
    }
  };

  // ---------- the filters, kept in this browser ----------
  var f = { q: '', held: false, src: '', sort: KEY, dir: 1, facet: {} };
  try { var kept = JSON.parse(store('filter') || 'null'); if (kept) f = Object.assign(f, kept, { facet: Object.assign({}, kept.facet || {}) }); } catch (e) { /* storage closed */ }
  function keep() { store('filter', JSON.stringify(f)); }

  function text(r) { return C.search ? C.search(r) : COLS.map(function (c) { var x = r[c.key]; return Array.isArray(x) ? x.join(' ') : x == null ? '' : String(x); }).join(' '); }
  function shown() {
    var q = f.q.trim().toLowerCase(), sub = subById(subId), col = COLS.filter(function (c) { return c.key === f.sort; })[0];
    return C.rows.filter(function (r) {
      if (!inSub(sub, r)) return false;
      if (f.held && !(r[HELD] || []).length) return false;
      if (C.source && f.src && String(!!C.source.test(r)) !== f.src) return false;
      for (var i = 0; i < FACETS.length; i++) { var v = f.facet[FACETS[i].id]; if (v && !FACETS[i].test(r, v)) return false; }
      return !q || text(r).toLowerCase().indexOf(q) >= 0;
    }).map(function (r, i) { return [r, i]; }).sort(function (a, b) {
      var x = col && typeof col.sort === 'function' ? col.sort(a[0], b[0]) : col ? String(a[0][col.key] == null ? '' : a[0][col.key]).localeCompare(String(b[0][col.key] == null ? '' : b[0][col.key]), undefined, { numeric: true }) : 0;
      return (x || a[1] - b[1]) * (x ? f.dir : 1);
    }).map(function (p) { return p[0]; });
  }

  // ---------- the table ----------
  function cell(c, r) { if (c.html) return c.html(r); var x = r[c.key]; return x == null || x === '' ? '<span class="faint">—</span>' : esc(Array.isArray(x) ? x.join(', ') : String(x)); }
  function rowHTML(r) {
    var held = r[HELD] || [];
    var go = held.map(function (vid) {
      var v = V.byId(vid), t = v ? (C.heldLabel ? C.heldLabel(r, v) : v.label) : vid;
      return '<button class="btn cat-read" data-cat-read="' + esc(vid) + '" title="Read ' + esc(v ? v.label : vid) + (SW.refOf ? ' [' + esc(SW.refOf(vid)) + ']' : '') + '">' + esc(t) + ' ▸</button>';
    }).join('') + (C.extra ? C.extra(r) : '');
    var src = C.source ? '<td>' + (C.source.test(r) ? '<span class="badge cat-in">' + esc(C.source.yes || C.source.label) + '</span>' : '<span class="badge cat-out">' + esc(C.source.no || 'not in ' + C.source.label) + '</span>') + '</td>' : '';
    return '<tr' + (held.length ? ' class="cat-held"' : '') + '>' + COLS.map(function (c) { return '<td' + (c.cls ? ' class="' + c.cls + '"' : '') + '>' + cell(c, r) + '</td>'; }).join('') + src + '<td class="cat-go">' + go + '</td></tr>';
  }

  function render() {
    var rows = shown(), sub = subById(subId), all = C.rows.filter(function (r) { return inSub(sub, r); }).length;
    var arrow = function (k) { return f.sort === k ? (f.dir > 0 ? ' ↑' : ' ↓') : ''; };
    var facetHTML = FACETS.map(function (fc) {
      var v = f.facet[fc.id] || '';
      if (fc.kind === 'select') return '<label>' + esc(fc.label) + ' <select data-cat-facet="' + esc(fc.id) + '">' + fc.options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (v === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
      return '<span class="seg-btns" role="group" aria-label="' + esc(fc.label) + '">' + fc.options.map(function (o) { return '<button class="btn' + (v === o[0] ? ' on' : '') + '" data-cat-seg="' + esc(fc.id) + '" data-v="' + esc(o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') + '</span>';
    }).join('');
    var srcHTML = C.source ? '<label title="' + esc(C.source.title || '') + '">' + esc(C.source.label) + ' <select id="cat-src"><option value="">Any</option><option value="true"' + (f.src === 'true' ? ' selected' : '') + '>' + esc(C.source.yes || C.source.label) + '</option><option value="false"' + (f.src === 'false' ? ' selected' : '') + '>' + esc(C.source.no || 'not in ' + C.source.label) + '</option></select></label>' : '';
    view.innerHTML = '<div class="pad catalogue">' +
      (C.title ? '<h2>' + C.title + '</h2>' : '') +
      (C.intro ? '<div class="hint flow">' + (typeof C.intro === 'function' ? C.intro(api) : C.intro) + '</div>' : '') +
      (SUBS.length > 1 ? '<div class="cat-subset"><label>Subset <select id="cat-sub">' + SUBS.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === subId ? ' selected' : '') + '>' + esc(x.label) + '</option>'; }).join('') + '</select></label>' +
        (sub.note ? '<span class="hint flow">' + esc(sub.note) + (sub.line ? ' Versions › Genealogy › Flow follows it.' : '') + '</span>' : '') + '</div>' : '') +
      '<div class="cat-filters">' +
        '<input type="search" id="cat-q" placeholder="Find a ' + esc(NOUN) + ', a word, a year" value="' + esc(f.q) + '" aria-label="Find a ' + esc(NOUN) + '">' +
        facetHTML + srcHTML +
        '<label><input type="checkbox" id="cat-held"' + (f.held ? ' checked' : '') + '> Held here</label>' +
        '<span class="faint cat-count">' + rows.length + ' of ' + all + (sub.id ? ' in ' + esc(sub.short || sub.label) : '') + '</span>' +
      '</div>' +
      '<div class="cat-wrap"><table class="data cat-table"><thead><tr>' +
        COLS.map(function (c) { return '<th' + (c.sort ? ' data-cat-sort="' + esc(c.key) + '"' : '') + '>' + esc(c.label) + (c.sort ? arrow(c.key) : '') + '</th>'; }).join('') +
        (C.source ? '<th title="' + esc(C.source.title || '') + '">' + esc(C.source.label) + '</th>' : '') + '<th></th>' +
      '</tr></thead><tbody>' + (rows.length ? rows.map(rowHTML).join('') : '<tr><td colspan="' + (COLS.length + 2) + '" class="hint">No ' + esc(NOUN) + ' matches.</td></tr>') + '</tbody></table></div>' +
      (C.foot ? '<div class="hint flow cat-foot">' + C.foot + '</div>' : '') +
      '</div>';
    wire();
  }

  function wire() {
    var q = SW.$('#cat-q', view);
    q.oninput = function () { f.q = q.value; keep(); var at = q.selectionStart; render(); var q2 = SW.$('#cat-q', view); q2.focus(); q2.setSelectionRange(at, at); };
    var sb = SW.$('#cat-sub', view); if (sb) sb.onchange = function (e) { subsets.set(e.target.value); };
    var sr = SW.$('#cat-src', view); if (sr) sr.onchange = function (e) { f.src = e.target.value; keep(); render(); };
    SW.$('#cat-held', view).onchange = function (e) { f.held = e.target.checked; keep(); render(); };
    SW.$$('[data-cat-facet]', view).forEach(function (s) { s.onchange = function () { f.facet[s.dataset.catFacet] = s.value; keep(); render(); }; });
    view.onclick = function (e) {
      var t = e.target.closest('[data-cat-seg]');
      if (t) { f.facet[t.dataset.catSeg] = t.dataset.v; keep(); render(); return; }
      var h = e.target.closest('[data-cat-sort]');
      if (h) { var k = h.dataset.catSort; f.dir = f.sort === k ? -f.dir : 1; f.sort = k; keep(); render(); return; }
      var r = e.target.closest('[data-cat-read]');
      if (r) { if (SW.nav) SW.nav.go({ v: r.dataset.catRead, p: null, n: null }); else { SW.select(r.dataset.catRead); SW.setTab('read'); } return; }
      var o = e.target.closest('[data-cat-open]');
      if (o) { e.preventDefault(); SW.openAt(o.dataset.catOpen); }
    };
  }

  var api = SW.catalogue = { rows: C.rows, subsets: subsets, render: render, held: function () { return C.rows.filter(function (r) { return (r[HELD] || []).length; }).length; } };
  SW.views[C.view] = { show: render, enter: render };
})(typeof window !== 'undefined' ? window : globalThis);
