/*
 * graphics.js - the Graphics tab: pictures of the program, one at a time, chosen from a menu in
 * the view's heading and from Graphics ▾ in the tab row. The pictures are the bench's. From
 * SW.BENCH.graphics:
 *   list        [[id, name, text]]: every graphic
 *   groups      [[heading, [id]]]: the menus' groups, in columns
 *   start       the graphic first shown; store, the key it is kept under (gfx.item)
 *   draw        { id: function (b, el, head) }: draws graphic id for version b into el (the page,
 *               under its heading); returns a function that stops it (an animation), or
 *               { stop, blocks } where blocks() gives the export's blocks
 *   menuOnly    [id]: items of Graphics ▾ that open elsewhere (the bench's SW.BENCH.menus.pick
 *               takes them), left out of the view's own menu
 *   noSource(b) HTML in place of a graphic for a version with nothing to draw (by default, one
 *               with no text)
 * SW.setGraphic(id) (a link's &g=, before the view is drawn), SW.openGraphic(id), SW.gfxItem(),
 * SW.graphics.render() draws the graphic again.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH, esc = SW.esc;
  function C() { return B.graphics || {}; }
  function key() { return C().store || 'gfx.item'; }
  var gid = null, build = null, stop = null;

  function list() { return C().list || []; }
  function item(id) { return list().filter(function (g) { return g[0] === id; })[0]; }
  function valid(id) { return !!item(id) && (C().menuOnly || []).indexOf(id) < 0; }
  function current() {
    if (gid == null) gid = SW.store.get(key(), C().start);
    if (!valid(gid)) gid = C().start && valid(C().start) ? C().start : (list()[0] || [])[0];
    return gid;
  }
  function slug() { return B.slug || String(B.name || 'bench').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  // the graphics in their groups, as buttons with attr (data-pick in the tab row, data-g in the view)
  function items(attr, on, skip) {
    var groups = C().groups || [['', list().map(function (g) { return g[0]; })]];
    return groups.map(function (grp) {
      var its = grp[1].filter(function (id) { return (skip || []).indexOf(id) < 0; }).map(item).filter(Boolean);
      if (!its.length) return '';
      return '<div class="gfx-grp">' + (grp[0] ? '<div class="menu-group">' + esc(grp[0]) + '</div>' : '') +
        its.map(function (g) { return '<button ' + attr + '="' + g[0] + '"' + (g[0] === on ? ' class="on"' : '') + '><b>' + esc(g[1]) + '</b><span>' + esc(g[2]) + '</span></button>'; }).join('') + '</div>';
    }).join('');
  }
  function expMenu(w) {
    var d = SW.el('details', { class: 'menu exp-menu tb-right' });
    d.innerHTML = '<summary class="btn" title="Export this graphic">⤓ Export ▾</summary>';
    var body = SW.el('div', { class: 'menu-body' });
    body.appendChild(w); d.appendChild(body);
    return d;
  }

  function render() {
    var el = SW.$('#view-graphics'), b = build; if (!el || !b) return;
    if (stop) { try { stop(); } catch (e) { /* ignore */ } stop = null; }
    el.innerHTML = '';
    var id = current(), G = item(id); if (!G) return;
    var pad = SW.el('div', { class: 'pad gfx-page', style: 'max-width:none' });
    var head = SW.el('div', { class: 'toolbar an-head', style: 'position:static;padding:0 0 10px' });
    head.innerHTML = '<details class="menu lens-menu"><summary class="btn" title="Choose a graphic">' + esc(G[1]) + ' ▾</summary><div class="menu-body lens-list">' +
      items('data-g', id, C().menuOnly) + '</div></details><span class="hint an-desc">' + esc(G[2]) + '.</span>';
    head.addEventListener('click', function (e) { var t = e.target.closest('[data-g]'); if (t) { gid = t.dataset.g; SW.store.set(key(), gid); SW.writeQuery(); render(); } });
    pad.appendChild(head);
    el.appendChild(pad);
    var none = C().noSource ? C().noSource(b) : (!b.v.build ? 'No source survives for ' + esc(b.v.label) + ', so there is nothing to draw.' : null);
    if (none) { pad.appendChild(SW.el('p', { class: 'hint' }, none)); return; }
    var draw = (C().draw || {})[id]; if (!draw) return;
    var r = draw(b, pad, head);
    if (typeof r === 'function') stop = r;
    else if (r) {
      stop = r.stop || null;
      if (r.blocks) head.appendChild(expMenu(SW.exportButtons(function () {
        return { title: b.v.label + ': ' + G[1].toLowerCase(), subtitle: G[2], meta: SW.docMeta(b), blocks: r.blocks() };
      }, slug() + '-' + b.v.id + '-' + id)));
    }
  }
  if (SW.$('#view-graphics')) SW.views.graphics = { show: function (b) { build = b; render(); } };

  SW.setGraphic = function (id) { if (valid(id)) { gid = id; SW.store.set(key(), id); } };
  SW.gfxItem = function () { return current(); };
  SW.openGraphic = function (id) { SW.setGraphic(id); SW.forget('graphics'); SW.setTab('graphics'); };
  SW.graphics = {
    render: function () { if (build && SW.state.tab === 'graphics') render(); },
    // Graphics ▾ in the tab row (kit/menus.js)
    // Graphics ▾: a submenu for each group (its first graphics named under it), the ungrouped as they are
    menuHTML: function (which) {
      if (which !== 'graphics' || !B.graphics) return null;
      var on = SW.state.tab === 'graphics' ? current() : null, groups = C().groups || [['', list().map(function (g) { return g[0]; })]];
      return groups.map(function (grp) {
        var its = grp[1].map(item).filter(Boolean); if (!its.length) return '';
        var html = its.map(function (g) { return '<button data-pick="' + g[0] + '"' + (g[0] === on ? ' class="on"' : '') + '><b>' + esc(g[1]) + '</b><span>' + esc(g[2]) + '</span></button>'; }).join('');
        return grp[0] && SW.menuSub ? SW.menuSub(esc(grp[0]), esc(SW.menuFirst ? SW.menuFirst(its) : ''), html, its.some(function (g) { return g[0] === on; })) : html;
      }).join('');
    },
    pick: function (which, p) { if (which !== 'graphics' || !valid(p)) return false; SW.openGraphic(p); return true; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
