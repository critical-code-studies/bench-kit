/*
 * lenses.js - the Analyse view: lenses on a version, each a set of cards with its own export, and
 * numbered so that a lens can be named in discussion ("lens 3"); and the tab row's lens menus. The
 * lenses themselves are the bench's. From SW.BENCH.lenses:
 *   list        [[n, name, text]]: every lens, by its number
 *   menus       { menu: [[heading, [n]]] }: the lenses in each of the tab row's menus (data-menu); a
 *               lens alone in its menu is named in the view's heading, without a menu
 *   picks       { pick: n }: items of Versions ▾ that open a lens (absence: 8)
 *   one         { n: function (b, el) }: draws lens n on a version into el (a grid of cards) and
 *               returns a function giving the export's blocks, or null
 *   across      { n: function (vs, bs, el, redraw) }: lens n across the versions, offered as a second
 *               mode where it is given; acrossLabel names the mode ('Across the versions')
 *   versions()  the versions read across (by default every one with a text); picker(el, redraw), a
 *               control to choose them, drawn above the cards
 *   history     { n, title(), file() }: the lens that follows one name through the versions (no
 *               second mode; the bench's SW.biography(name) sets the name and calls SW.openLens(n))
 *   functional  the number of the lens that is bench-kit's Functional overview (kit/functional.js)
 *   anySource   [n]: lenses drawn for a version with no text (the record of what is lost)
 *   noSource(b) HTML for a version with no text, in place of a lens that needs one
 *   skip        [n]: numbers kept for lenses that have moved elsewhere, not opened from a link
 * SW.openLens(n), SW.setLens(n) (a link's &lens=, before the view is drawn), SW.anLens(),
 * SW.anLensName(); SW.lenses.render() draws the lens again, SW.lenses.build() is the version it is
 * drawn on; SW.lenses.card(title, lede), wide(card), bars(rows, max) and expMenu(buttons) are its parts.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH, esc = SW.esc;
  function C() { return B.lenses || {}; }
  var lens = SW.store.get('an.lens', 1), mode = SW.store.get('an.mode', 'one'), build = null;

  function list() { return C().list || []; }
  function L(n) { return list().filter(function (l) { return l[0] === n; })[0]; }
  function valid(n) { return !!L(n) && (C().skip || []).indexOf(n) < 0; }
  function current() { if (!valid(lens) && list().length) lens = list()[0][0]; return lens; }
  function slug() { return B.slug || String(B.name || 'bench').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  SW.anLens = function () { return current(); };
  SW.anLensName = function () { var l = L(current()); return l ? l[1] : 'Analyse'; };

  // ---------- the parts of a lens ----------
  function card(title, lede) {
    var c = SW.el('div', { class: 'card' });
    c.innerHTML = '<h3>' + esc(title) + '</h3>' + (lede ? '<p class="lede">' + lede + '</p>' : '');
    return c;
  }
  function wide(c) { c.style.gridColumn = '1 / -1'; return c; }
  // a bar chart of [label, count] rows
  function bars(rows, max) {
    max = max || rows.reduce(function (m, r) { return Math.max(m, r[1]); }, 1);
    return '<div class="bars">' + rows.map(function (r) {
      return '<div class="b"><span title="' + esc(r[0]) + '">' + esc(r[0]) + '</span><i style="width:' + (100 * r[1] / max).toFixed(1) + '%"></i><em>' + r[1] + '</em></div>';
    }).join('') + '</div>';
  }

  // ---------- the menus ----------
  function menuOf(n) { var M = C().menus || {}; for (var m in M) if (M[m].some(function (g) { return g[1].indexOf(n) >= 0; })) return m; return null; }
  function items(groups, attr, on) {
    return groups.map(function (g) {
      return '<div class="lens-g">' + (g[0] ? '<h5>' + esc(g[0]) + '</h5>' : '') + g[1].map(function (n) {
        var l = L(n); if (!l) return '';
        return '<button ' + attr + '="' + n + '"' + (n === on ? ' class="on"' : '') + '><b>' + esc(l[1]) + '</b><span>' + esc(l[2]) + '</span></button>';
      }).join('') + '</div>';
    }).join('');
  }
  function expMenu(w) {
    var d = SW.el('details', { class: 'menu exp-menu tb-right' });
    d.innerHTML = '<summary class="btn" title="Export this lens">⤓ Export ▾</summary>';
    var body = SW.el('div', { class: 'menu-body' });
    body.appendChild(w); d.appendChild(body);
    return d;
  }
  function exp(head, doc, file) { head.appendChild(expMenu(SW.exportButtons(doc, file))); }

  // ---------- the view ----------
  function render() {
    var view = SW.$('#view-analyse'), b = build, c = C(), n = current(), l = L(n);
    if (!view || !b || !l) return;
    view.innerHTML = '';
    var pad = SW.el('div', { class: 'pad', style: 'max-width:none' });
    var head = SW.el('div', { class: 'toolbar an-head', style: 'position:static;padding:0 0 10px' });
    var mg = (c.menus || {})[menuOf(n)] || [['', [n]]];
    var hist = c.history && c.history.n === n, fo = c.functional === n;
    var canAcross = !!(c.across || {})[n] && !hist && !fo, across = canAcross && mode === 'across';
    head.innerHTML = (mg.length === 1 && mg[0][1].length === 1 ? '<b class="an-title">' + esc(l[1]) + '</b>' :
      '<details class="menu lens-menu"><summary class="btn" title="Choose">' + esc(l[1]) + ' ▾</summary><div class="menu-body lens-list">' + items(mg, 'data-l', n) + '</div></details>') +
      (canAcross ? '<span class="seg-btns"><button class="btn' + (!across ? ' on' : '') + '" data-mode="one">This version</button><button class="btn' + (across ? ' on' : '') + '" data-mode="across">' + esc(c.acrossLabel || 'Across the versions') + '</button></span>' : '') +
      '<span class="hint an-desc">' + esc(l[2]) + '.</span>' + (!across && !hist ? ' <span class="an-ref">' + SW.refTag(b.v.id) + '</span>' : '');
    head.addEventListener('click', function (e) {
      var t = e.target.closest('[data-l]');
      if (t) { lens = +t.dataset.l; SW.store.set('an.lens', lens); SW.writeQuery(); render(); return; }
      var m = e.target.closest('[data-mode]'); if (m) { mode = m.dataset.mode; SW.store.set('an.mode', mode); render(); }
    });
    pad.appendChild(head);
    var cards = SW.el('div', { class: 'cards' });
    pad.appendChild(cards);
    view.appendChild(pad);
    SW.markTabs();
    var generated = [['Generated', SW.fmtDate(SW.today()) + ', ' + (B.title || 'Research Bench') + ' v' + SW.VERSION]];
    if (!across && !b.asm && (c.anySource || []).indexOf(n) < 0) {
      cards.innerHTML = '<p class="hint">' + (c.noSource ? c.noSource(b) : 'No source survives for ' + esc(b.v.label) + '.') + '</p>';
      return;
    }
    if (fo) {   // bench-kit's Functional overview: read from the source, or the bench's recording of a run
      var sw = SW.functionalOverview.switchEl(render); if (sw) head.appendChild(sw);
      var fb = SW.functionalOverview.render(b, cards, { inline: true });
      if (fb) exp(head, function () { return { title: b.v.label + ': ' + l[1].toLowerCase() + ', read from the source', subtitle: l[2], meta: SW.docMeta(b), blocks: fb() }; }, slug() + '-' + b.v.id + '-functional-overview');
      return;
    }
    if (hist) {
      var hb = c.one[n](b, cards), H = c.history;
      if (hb) exp(head, function () { return { title: H.title ? H.title() : (B.name || '') + ': ' + l[1].toLowerCase(), subtitle: l[2], meta: generated, blocks: hb() }; }, H.file || slug() + '-lens-' + n);
      return;
    }
    if (across) {
      var vs = c.versions ? c.versions() : root.SWVersions.VERSIONS.filter(function (v) { return v.build; }).sort(function (a, x) { return a.sort - x.sort; });
      if (c.picker) c.picker(cards, render);
      var wait = SW.el('p', { class: 'hint' }, ((B.compare || {}).reading || 'Reading') + ' ' + vs.length + ' versions…');
      cards.appendChild(wait);
      Promise.all(vs.map(function (v) { return SW.build(v.id); })).then(function (bs) {
        wait.remove();
        if (!vs.length) { cards.appendChild(SW.el('p', { class: 'hint' }, 'Choose some versions.')); return; }
        var bl = c.across[n](vs, bs, cards, render);
        if (bl) exp(head, function () {
          return { title: (B.name || '') + ' ' + (c.acrossLabel || 'Across the versions').toLowerCase() + ': ' + l[1].toLowerCase(), subtitle: l[2],
                   meta: [['Versions', vs.map(function (v) { return v.label + ' ' + SW.refText(v.id) + ' (' + v.date + ')'; }).join('; ')]].concat(generated), blocks: bl() };
        }, slug() + '-across-lens-' + n);
      }).catch(function (e) { wait.textContent = e.message; });
      return;
    }
    var blocks = c.one[n](b, cards);
    if (blocks) exp(head, function () { return { title: b.v.label + ': ' + l[1].toLowerCase(), subtitle: l[2], meta: SW.docMeta(b), blocks: blocks() }; }, slug() + '-' + b.v.id + '-lens-' + n);
  }
  if (SW.$('#view-analyse')) SW.views.analyse = { show: function (b) { build = b; render(); } };

  // ---------- opening a lens ----------
  function open(n) { if (n !== lens) { lens = n; SW.store.set('an.lens', n); SW.forget('analyse'); } SW.setTab('analyse'); }
  SW.openLens = function (n) { lens = +n; SW.store.set('an.lens', lens); SW.forget('analyse'); SW.setTab('analyse'); };
  SW.setLens = function (n) { n = +n; if (valid(n)) { lens = n; SW.store.set('an.lens', n); } };

  SW.lenses = {
    render: function () { if (build && SW.state.tab === 'analyse') render(); },
    build: function () { return build; },   // the version the view is drawn on, for a lens's late work to check
    card: card, wide: wide, bars: bars, expMenu: expMenu,
    // the tab row's menus (kit/menus.js): a lens menu's items, and a pick from it or from Versions ▾
    menuHTML: function (which) { var g = (C().menus || {})[which]; return g ? items(g, 'data-pick', SW.state.tab === 'analyse' ? current() : 0) : null; },
    pick: function (which, p) {
      var n = which === 'versions' ? (C().picks || {})[p] : (C().menus || {})[which] ? +p : null;
      if (!n) return false;
      open(n); return true;
    },
    on: function (which, p) { var n = which === 'versions' && (C().picks || {})[p]; return n ? SW.state.tab === 'analyse' && current() === n : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
