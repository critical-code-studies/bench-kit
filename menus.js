/*
 * menus.js - the drop-down menus in the tab row: a button in #tabs with data-menu="<name>" opens
 * a menu under it (a click outside, or Esc, closes it). Versions and Help are the kit's; the
 * lenses' menus are kit/lenses.js's (SW.BENCH.lenses.menus) and Graphics ▾ is kit/graphics.js's;
 * any other menu the bench draws itself. From SW.BENCH.menus:
 *   versions          [[pick, label, text]]: Versions ▾ (by default This version, Compare,
 *                     Genealogy); a pick that is a view goes to it
 *   help              Help ▾: changes to the kit's list (below), or the whole list as
 *                     [[group, [[pick, label, text]]]]; a pick opens the Help item of that name
 *                     (SW.help, kit/shell.js). The changes:
 *                       text  { pick: text }: a new line under an item's name
 *                       add   [[where, item]]: an item [pick, label, text] put after the item
 *                             picked as `where`, or first in the group named `where`; an item
 *                             given as a pick alone moves the kit's item there
 *                       drop  [pick]: items left out
 *                     Site map is in the list when SW.BENCH.sitemap is set (a sitemap.html).
 *   menu(which)       HTML for a menu of the bench's own (buttons with data-pick), or null
 * Read ▾ (a tab button with data-menu="read" data-tabs="read") lists the versions in the version
 * picker's groups, unless the bench draws its own (kit/layers.js does, by layer). A bench that sets
 * readFiles { groups: [{ label, note, test (on a file's name, without its version), rest (takes
 * the files no group names) }], about(src, role) } has the versions in a submenu, then the open
 * version's code by part, each file opening in Read.
 *   pick(which, p)    a pick the bench handles itself (a graphic, a Versions item that
 *                     is not a view); true when it has
 *   on(which, p)      whether a Versions item is the one open, where it is not a view
 * A menu's HTML may hold submenus, made with SW.menuSub(label, text, inner, on): an item that
 * opens a list of its own beside it (on a pointer's rest, a click or a tap, or →; ← or Esc
 * closes it), placed against the window so the menu's own scrolling cannot clip it, and opened in
 * place on a narrow screen. Submenus nest.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH;
  function H() { return B.menus || {}; }

  var VERSIONS = [['about', 'This version', 'Its record, sources and annotations'],
                  ['compare', 'Compare', 'Two versions side by side'],
                  ['genealogy', 'Genealogy', 'How the versions descend']];
  function HELP() {
    var repo = (B.repo || (B.about || {}).code || '').replace(/^https?:\/\//, '');
    var ex = (B.refHelp || {}).example;
    return [['Reading the bench', [['tour', 'Take the welcome tour', 'A few stops through the bench'],
                                 ['refs', 'Referencing and versions', ex ? 'How the bench cites a source, as ' + ex : 'How the bench cites a source']]
                                .concat(B.reading ? [['reading', 'What you should read', (B.reading || {}).menu || 'The reading behind the bench']] : [])
                                .concat(B.cards ? [['cards', 'Reconstruction cards', (B.cards || {}).menu || 'What the bench does to each version to read and run it']] : [])
                                .concat([['marks', 'Marks and conventions', 'Losses, restorations and doubtful readings: the marks, and their Leiden forms']])
                                .concat(B.sitemap ? [['sitemap', 'Site map', 'Every view and version as a plain link']] : [])],
            ['Annotating and sharing', [['join', 'Joining the annotation group', 'An invitation, a Hypothesis account and your tokens, step by step'],
                                        ['anno', 'Advanced annotation', 'Rich text, and links between annotations across versions'],
                                        ['codes', 'Codes, links and sharing', 'Every item’s code, links in annotations, Share, Findings and My notes'],
                                        ['paratexts', 'Paratexts', 'Scans and documents: collections, views, metadata, links']]],
            ['Your bench', [['settings', 'Settings', 'Initials, group, theme, fonts'],
                            ['backup', 'Back up everything', 'Notes, drafts, settings and findings in one file'],
                            ['restore', 'Restore from a backup…', 'Brings back notes and drafts beside those here']]],
            ['The project', [['code', 'Source code on GitHub ↗', repo],
                             ['issue', 'Report a problem ↗', 'GitHub issues'],
                             ['about', 'About the bench', 'Version, sources, citation']]]];
  }

  // Help ▾ as the bench has it: the kit's list with the bench's changes, or the bench's own list
  function helpList() {
    var h = H().help;
    if (Array.isArray(h)) return h;
    var G = HELP().map(function (g) { return [g[0], g[1].slice()]; });
    if (!h) return G;
    function find(p) {
      for (var i = 0; i < G.length; i++) for (var j = 0; j < G[i][1].length; j++) if (G[i][1][j][0] === p) return { g: G[i][1], j: j };
      return null;
    }
    (h.drop || []).forEach(function (p) { var f = find(p); if (f) f.g.splice(f.j, 1); });
    (h.add || []).forEach(function (a) {
      var it = a[1];
      if (typeof it === 'string') { var m = find(it); if (!m) return; it = m.g.splice(m.j, 1)[0]; }
      var grp = G.filter(function (g) { return g[0] === a[0]; })[0];
      if (grp) { grp[1].unshift(it); return; }
      var f = find(a[0]); if (f) f.g.splice(f.j + 1, 0, it); else G[G.length - 1][1].push(it);
    });
    var T = h.text || {};
    G.forEach(function (g) { g[1] = g[1].map(function (it) { return T[it[0]] != null ? [it[0], it[1], T[it[0]]] : it; }); });
    return G;
  }

  SW.helpList = helpList;

  var tabMenu = null;
  // ---------- submenus ----------
  SW.menuSub = function (label, text, inner, on) {
    return '<div class="menu-sub"><button class="menu-subopen' + (on ? ' on' : '') + '" aria-haspopup="menu" aria-expanded="false"><b>' + label + '</b>' +
      (text ? '<span>' + text + '</span>' : '') + '<i class="menu-subcaret" aria-hidden="true">▸</i></button><div class="menu-subbody" role="menu" hidden>' + inner + '</div></div>';
  };
  function subOpen(sub, focus) {
    var body = sub.querySelector(':scope > .menu-subbody'), btn = sub.querySelector(':scope > .menu-subopen'); if (!body || !body.hidden) { if (focus && body) { var f0 = body.querySelector('button'); if (f0) f0.focus({ preventScroll: true }); } return; }
    // the others at this level close
    SW.$$(':scope > .menu-sub', sub.parentNode).forEach(function (o) { if (o !== sub) subClose(o); });
    body.hidden = false; btn.setAttribute('aria-expanded', 'true'); sub.classList.add('open');
    if (window.innerWidth < 640) { body.classList.add('inline'); body.style.cssText = ''; }
    else {
      body.classList.remove('inline');
      var r = btn.getBoundingClientRect(), w = body.offsetWidth, h = body.offsetHeight;
      var left = r.right + 2 + w > window.innerWidth - 6 ? Math.max(6, r.left - w - 2) : r.right + 2;
      var top = Math.max(6, Math.min(r.top - 6, window.innerHeight - h - 6));
      body.style.left = left + 'px'; body.style.top = top + 'px';
    }
    if (focus) { var f = body.querySelector('button'); if (f) f.focus({ preventScroll: true }); }
  }
  function subClose(sub) {
    var body = sub.querySelector(':scope > .menu-subbody'), btn = sub.querySelector(':scope > .menu-subopen'); if (!body || body.hidden) return;
    SW.$$('.menu-sub', body).forEach(subClose);
    body.hidden = true; btn.setAttribute('aria-expanded', 'false'); sub.classList.remove('open');
  }
  function wireSubs(el) {
    var hover = window.matchMedia && window.matchMedia('(hover: hover)').matches, timers = new Map();
    el.addEventListener('click', function (e) {
      var b = e.target.closest('.menu-subopen'); if (!b) return;
      e.stopPropagation(); var sub = b.parentNode, body = sub.querySelector(':scope > .menu-subbody');
      if (body.hidden) subOpen(sub, e.detail === 0); else if (!hover) subClose(sub);
    });
    if (hover) {
      el.addEventListener('mouseover', function (e) {
        var sub = e.target.closest('.menu-sub'); if (!sub) return;
        // a submenu reached: the openers crossed on the way to it do not open (the pointer's path
        // from an item to its list runs over its neighbours)
        timers.forEach(function (t, k) { if (k !== sub && !k.contains(sub)) clearTimeout(t); });
        if (sub.classList.contains('open')) { clearTimeout(timers.get(sub)); if (!e.target.closest('.menu-subopen')) return; }   // back in an open one: it stays
        // a neighbour's list open: wait a little longer before switching, for a pointer on its way there
        var openNear = SW.$$(':scope > .menu-sub.open', sub.parentNode).some(function (o) { return o !== sub; });
        clearTimeout(timers.get(sub)); timers.set(sub, setTimeout(function () { subOpen(sub); }, openNear ? 260 : 120));
        // the open ones not on the pointer's way close, after a moment
        SW.$$('.menu-sub.open', el).forEach(function (o) { if (!o.contains(e.target)) { clearTimeout(timers.get(o)); timers.set(o, setTimeout(function () { if (!o.matches(':hover')) subClose(o); }, 320)); } });
      });
    }
    el.addEventListener('keydown', function (e) {
      var b = document.activeElement, inSub = b && b.closest && b.closest('.menu-subbody');
      if (e.key === 'ArrowRight' && b.classList.contains('menu-subopen')) { e.preventDefault(); subOpen(b.parentNode, true); }
      else if ((e.key === 'ArrowLeft' || e.key === 'Escape') && inSub) {   // back out one level, to the item that opened it
        var own = inSub.parentNode; e.preventDefault(); e.stopPropagation(); subClose(own); own.querySelector(':scope > .menu-subopen').focus({ preventScroll: true });
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        var list = b.closest('.menu-subbody') || el, items = SW.$$(':scope > button, :scope > .menu-sub > .menu-subopen', list), i = items.indexOf(b);
        if (i >= 0) { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus({ preventScroll: true }); }
      }
    });
  }
  function closeTabMenu() { if (!tabMenu) return; tabMenu.el.remove(); tabMenu.btn.setAttribute('aria-expanded', 'false'); tabMenu = null; }
  // what a submenu holds, in brief: its first items' names
  function firstOf(list) { return list.slice(0, 3).map(function (h) { return h[1].replace(/ ↗$/, ''); }).join(', ') + (list.length > 3 ? '…' : ''); }
  SW.menuFirst = firstOf;
  function item(h, on) { return '<button data-pick="' + SW.esc(h[0]) + '"' + (on ? ' class="on"' : '') + '><b>' + SW.esc(h[1]) + '</b><span>' + SW.esc(h[2]) + '</span></button>'; }

  function menuHTML(which) {
    if (which === 'help') {
      var dm = document.querySelector('meta[name="bench-date"]');
      // a submenu for each group, its first items named under it; the bench's version at the foot
      return helpList().map(function (g) { return SW.menuSub(SW.esc(g[0]), SW.esc(firstOf(g[1])), g[1].map(function (h) { return item(h); }).join('')); }).join('') + '<div class="help-ver hint">' + SW.esc(B.title) + ' ' + SW.esc(SW.VERSION) + (dm ? ', ' + SW.esc(SW.fmtDate(dm.content)) : '') + '</div>';
    }
    if (which === 'versions') return (H().versions || VERSIONS).map(function (h) {
      var on = H().on && H().on(which, h[0]); if (on == null && SW.lenses) on = SW.lenses.on(which, h[0]); if (on == null) on = SW.state.tab === h[0];
      return item(h, on);
    }).join('');
    var lm = SW.lenses ? SW.lenses.menuHTML(which) : null; if (lm != null) return lm;   // kit/lenses.js
    var gm = SW.graphics ? SW.graphics.menuHTML(which) : null; if (gm != null) return gm;   // kit/graphics.js
    var own = H().menu ? H().menu(which) : null; if (own) return own;
    return which === 'read' ? readHTML() : '';
  }
  // Read ▾, where a bench has no menu of its own for it (a bench in layers has kit/layers.js's):
  // the versions in the version picker's groups (SW.BENCH.forks), each opening in Read; another
  // reading of a version (witnessOf) under it, in a submenu. A long list (more than ten) takes a
  // submenu for each group, naming its versions; a short one is one list under the group headings.
  function readHTML() {
    var V = root.SWVersions, cur = SW.state.v, all = V.VERSIONS.slice().sort(function (a, b) { return a.sort - b.sort; });
    var groups = (B.forks && B.forks.length ? B.forks : [[null, '']]).map(function (g) { return [g[1], all.filter(function (v) { return g[0] == null || v.fork === g[0]; })]; })
      .filter(function (g) { return g[1].length; });
    function one(v) {
      return '<button data-pick="v:' + SW.esc(v.id) + '"' + (v.id === cur ? ' class="on"' : '') + '><b>' + SW.esc(v.label) + '</b><span>' +
        SW.esc([v.date, v.build ? v.medium || '' : 'lost: known from the record'].filter(Boolean).join(' · ')) + '</span></button>';
    }
    function list(vs) {
      return vs.filter(function (v) { return !v.witnessOf || vs.every(function (w) { return w.id !== v.witnessOf; }); }).map(function (v) {
        var wit = vs.filter(function (w) { return w.witnessOf === v.id; });
        return one(v) + (wit.length ? SW.menuSub('Other readings of ' + SW.esc(v.label), SW.esc(wit.map(function (w) { return w.label; }).join(', ')),
          wit.map(one).join(''), wit.some(function (w) { return w.id === cur; })) : '');
      }).join('');
    }
    var flat = function () { return groups.map(function (g, i) { return (i ? '<hr class="menu-rule">' : '') + (g[0] ? '<div class="menu-group">' + SW.esc(g[0]) + '</div>' : '') + list(g[1]); }).join(''); };
    // a bench that groups its files (SW.BENCH.readFiles): the versions in a submenu of their own,
    // then the open version's code by part, each file opening in Read
    var RF = B.readFiles;
    if (RF) {
      var v0 = V.byId(cur), parts = (v0 && v0.build) || [], ix = parts.map(function (b, i) { return [b, i]; }), used = {};
      var stem = function (src) { return src.split('/').pop().replace(/\.[^.]*$/, '').replace(/\.\d+$/, '').toLowerCase(); };
      var file = function (x) {
        return '<button data-pick="f:' + x[1] + '"><b>' + SW.esc(x[0].src.split('/').pop()) + '</b><span>' + SW.esc(RF.about ? RF.about(x[0].src, x[0].role) : x[0].role) + '</span></button>';
      };
      var gs = (RF.groups || []).map(function (g) {
        var fs = g.test ? ix.filter(function (x) { return !used[x[1]] && g.test.test(stem(x[0].src)); }) : [];
        fs.forEach(function (x) { used[x[1]] = 1; });
        return [g, fs];
      });
      var rest = ix.filter(function (x) { return !used[x[1]]; });
      return SW.menuSub('Versions', SW.esc(v0 ? v0.label : ''), all.length <= 10 ? flat() : groups.map(function (g) { return SW.menuSub(SW.esc(g[0] || 'Versions'), '', list(g[1]), g[1].some(function (v) { return v.id === cur; })); }).join('')) +
        (parts.length ? '<hr class="menu-rule"><div class="menu-group">The code of ' + SW.esc(v0.label) + '</div>' : '') +
        gs.map(function (x) {
          var fs = x[0].rest ? x[1].concat(rest) : x[1]; if (!fs.length) return '';
          return SW.menuSub(SW.esc(x[0].label), SW.esc(x[0].note || firstOf(fs.map(function (y) { return [0, stem(y[0].src)]; }))), fs.map(file).join(''));
        }).join('');
    }
    if (all.length <= 10) return flat();
    return groups.map(function (g) {
      var main = g[1].filter(function (v) { return !v.witnessOf; });
      return SW.menuSub(SW.esc(g[0] || 'Versions'), SW.esc(firstOf(main.map(function (v) { return [v.id, v.label]; }))), list(g[1]), g[1].some(function (v) { return v.id === cur; }));
    }).join('');
  }
  function pick(which, p) {
    if (H().pick && H().pick(which, p)) return;
    if (SW.lenses && SW.lenses.pick(which, p)) return;
    if (SW.graphics && SW.graphics.pick(which, p)) return;
    if (which === 'help') { SW.help(p); return; }
    if (which === 'read' && /^f:/.test(p)) { SW.openAt(SW.state.v, { p: +p.slice(2), n0: 1 }); return; }   // a file of the open version
    if (which === 'read' && /^v:/.test(p)) { if (p.slice(2) !== SW.state.v) SW.select(p.slice(2)); SW.setTab('read'); return; }
    if (which === 'versions') SW.setTab(p);
  }

  SW.$$('#tabs [data-menu]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();   // the menu, not the tab: choosing an item goes there
      var which = btn.dataset.menu;
      if (tabMenu && tabMenu.btn === btn) { closeTabMenu(); return; }
      closeTabMenu();
      var r = btn.getBoundingClientRect(), el = SW.el('div', { class: 'tab-menu lens-list', role: 'menu', 'data-w': which }, menuHTML(which));
      document.body.appendChild(el);
      el.style.top = r.bottom + 'px';
      el.style.left = Math.max(6, Math.min(r.left, window.innerWidth - el.offsetWidth - 6)) + 'px';
      btn.setAttribute('aria-expanded', 'true');
      tabMenu = { el: el, btn: btn };
      wireSubs(el);
      el.addEventListener('scroll', function () { SW.$$('.menu-sub.open', el).forEach(subClose); });   // a placed submenu would stay behind
      el.addEventListener('click', function (ev) {
        var t = ev.target.closest('[data-pick]');
        if (!t) return;
        closeTabMenu();
        pick(which, t.dataset.pick);
      });
    });
  });
  document.addEventListener('mousedown', function (e) { if (tabMenu && !tabMenu.el.contains(e.target) && !tabMenu.btn.contains(e.target)) closeTabMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTabMenu(); });
  window.addEventListener('resize', closeTabMenu);
})(typeof window !== 'undefined' ? window : globalThis);
