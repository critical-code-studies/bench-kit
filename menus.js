/*
 * menus.js - the drop-down menus in the tab row: a button in #tabs with data-menu="<name>" opens
 * a menu under it (a click outside, or Esc, closes it). Versions and Help are the kit's; the
 * lenses' menus are kit/lenses.js's (SW.BENCH.lenses.menus) and Graphics ▾ is kit/graphics.js's;
 * any other menu the bench draws itself. From SW.BENCH.menus:
 *   versions          [[pick, label, text]]: Versions ▾ (by default This version, Collate,
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
 *                     About the bench is always first in Help ▾, at the top level, not in a group.
 *   file              File ▾'s own items for the whole project, [[pick, label, text]] (exports of
 *                     every version, say), handled by pick('file', p)
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
 * File ▾, before Read, the kit puts in the tab row unless SW.BENCH.fileMenu is false: what acts on the
 * project as a whole. A version from files, a project or .ccs file opened and saved, a sample (where
 * kit/builder.js and kit/projectfile.js are loaded); the bench's own items (menus.file); back up and
 * restore.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH;
  function H() { return B.menus || {}; }
  var FILE_ON = B.fileMenu !== false;
  // File ▾ in the tab row, before Read (or first)
  (function () {
    var tabs = SW.$('#tabs'); if (!FILE_ON || !tabs || SW.$('[data-menu="file"]', tabs)) return;
    var btn = SW.el('button', { 'data-menu': 'file', 'aria-expanded': 'false', title: 'The project as a whole: open, save, back up, export' });
    btn.innerHTML = 'File <span class="caret" aria-hidden="true">▾</span>';
    var rd = SW.$('[data-menu="read"], [data-tab="read"]', tabs);
    tabs.insertBefore(btn, rd || tabs.firstChild);
  })();
  function projectItems() {
    return (SW.builder ? [['builder', 'Add a version from files', 'Files from this computer, read as a new version']] : [])
      .concat(SW.projectFile && SW.projectFile.save ? [['proj-open', 'Open a project or .ccs file', 'A project saved here, or a CCS Workbench session'],
                                                       ['proj-save', 'Save the project to a file', 'Its versions, files, repairs, settings, drafts and notes']] : [])
      .concat(SW.projectFile && SW.projectFile.save && B.samples ? [['proj-samples', 'Open a sample', 'A project from CCS Workbench Classic']] : []);
  }
  function FILE() {
    var groups = [projectItems(), H().file || [],
                  [['backup', 'Back up everything', 'Notes, drafts, settings and findings in one file'], ['restore', 'Restore from a backup…', 'Brings back notes and drafts beside those here']]];
    return groups.filter(function (g) { return g.length; });
  }

  // Collate's line in Versions ▾: the bench's own (SW.BENCH.words.collate), or the modes it offers
  // (compare.modes, the second mode by compareDefs.by, By function where the texts are Lisp)
  function collateText() {
    var w = (B.words || {}).collate; if (w) return w;
    var CB = B.compare || {}, lisp = SW.collateLisp ? SW.collateLisp() : false;   // kit/compare.js: a version held is Lisp
    // the second mode is named where the bench gives it a phrase (compareDefs.by: 'leaf' makes "by leaf")
    var by = (B.compareDefs || {}).by, say = { text: 'line by line', constants: by ? 'by ' + by : '', routines: 'by routine', functions: 'by function where both are Lisp' };
    var ms = (CB.modes || ['text', 'constants', 'routines', 'functions']).filter(function (m) { return say[m] && (m !== 'functions' || lisp); }).map(function (m) { return say[m]; });
    return 'Two versions collated' + (ms.length ? ': ' + (ms.length > 1 ? ms.slice(0, -1).join(', ') + (ms.length > 2 ? ',' : '') + ' and ' + ms[ms.length - 1] : ms[0]) : '');
  }
  function VERSIONS() {
    return [['about', 'This version', 'Its record, sources and annotations'],
            ['compare', 'Collate', collateText()],
            ['genealogy', 'Genealogy', 'How the versions descend']]
      .concat(FILE_ON ? [] : projectItems());   // in File ▾, where the bench has it
  }
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
                                        ['paratexts', 'Paratexts', 'Scans and documents: collections, views, metadata, links']]
                                       .concat(B.implementations ? [['implementations', 'Implementations', 'Ports, translations and reimplementations: their descent, features and comparison']] : [])],
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
      // the pointer's last few positions, to tell whether it is heading into an open list
      var pts = [];
      el.addEventListener('mousemove', function (e) { pts.push([e.clientX, e.clientY]); if (pts.length > 4) pts.shift(); });
      // heading into o's list: the pointer now inside the triangle from where it was to the list's near edge
      function aiming(o) {
        var body = o.querySelector(':scope > .menu-subbody'); if (!body || body.hidden || pts.length < 2) return false;
        var r = body.getBoundingClientRect(), p = pts[pts.length - 1], q = pts[0];
        if (p[0] === q[0] && p[1] === q[1]) return false;
        var x = r.left >= p[0] ? r.left : r.right, a = [x, r.top - 24], b = [x, r.bottom + 24];
        function side(u, v, w) { return (v[0] - u[0]) * (w[1] - u[1]) - (v[1] - u[1]) * (w[0] - u[0]); }
        var s1 = side(q, a, p), s2 = side(a, b, p), s3 = side(b, q, p);
        return (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0);
      }
      el.addEventListener('mouseover', function (e) {
        var sub = e.target.closest('.menu-sub'); if (!sub) return;
        // a submenu reached: the openers crossed on the way to it do not open
        timers.forEach(function (t, k) { if (k !== sub && !k.contains(sub)) clearTimeout(t); });
        if (sub.classList.contains('open')) { clearTimeout(timers.get(sub)); if (!e.target.closest('.menu-subopen')) return; }   // back in an open one: it stays
        // an opener opens at once, unless the pointer is crossing it on its way into a neighbour's open
        // list; then it waits, and opens if the pointer has stopped there
        var near = SW.$$(':scope > .menu-sub.open', sub.parentNode).filter(function (o) { return o !== sub; })[0], tries = 0;
        clearTimeout(timers.get(sub));
        (function attempt() {
          if (!sub.querySelector(':scope > .menu-subopen').matches(':hover')) return;
          if (near && near.classList.contains('open') && aiming(near) && tries++ < 4) { timers.set(sub, setTimeout(attempt, 90)); return; }
          subOpen(sub);
        })();
        // the open ones elsewhere close, unless the pointer is heading into them
        SW.$$('.menu-sub.open', el).forEach(function (o) {
          if (o.contains(e.target) || o === near) return;
          clearTimeout(timers.get(o)); timers.set(o, setTimeout(function () { if (!o.matches(':hover') && !aiming(o)) subClose(o); }, 150));
        });
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
      // About the bench first, at the top level, wherever the list has it (or not at all); then a
      // submenu for each group, its first items named under it; the bench's version at the foot
      var ab = null, G = helpList().map(function (g) { return [g[0], g[1].filter(function (h) { if (h[0] !== 'about') return true; ab = ab || h; return false; })]; })
        .filter(function (g) { return g[1].length; });
      return item(ab || ['about', 'About the bench', 'Version, sources, citation']) + G.map(function (g) { return SW.menuSub(SW.esc(g[0]), SW.esc(firstOf(g[1])), g[1].map(function (h) { return item(h); }).join('')); }).join('') + '<div class="help-ver hint">' + SW.esc(B.title) + ' ' + SW.esc(SW.VERSION) + (dm ? ', ' + SW.esc(SW.fmtDate(dm.content)) : '') + '</div>';
    }
    if (which === 'file') return FILE().map(function (g, i) { return (i ? '<hr class="menu-rule">' : '') + g.map(function (h) { return item(h); }).join(''); }).join('');
    if (which === 'versions') return (H().versions || VERSIONS()).map(function (h) {
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
    var groups = (SW.versionGroups ? SW.versionGroups('') : B.forks && B.forks.length ? B.forks : [[null, '']]).map(function (g) { return [g[1], all.filter(function (v) { return SW.inGroup ? SW.inGroup(v, g) : g[0] == null || v.fork === g[0]; })]; })
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
    if (which === 'file' && p === 'backup') { SW.backup.save(); return; }
    if (which === 'file' && p === 'restore') { SW.backup.restore(); return; }
    if ((which === 'versions' || which === 'file') && p === 'builder' && SW.builder) { SW.builder.open(); return; }
    if ((which === 'versions' || which === 'file') && /^proj-/.test(p) && SW.projectFile && SW.projectFile.save) { ({ 'proj-save': SW.projectFile.save, 'proj-open': SW.projectFile.choose, 'proj-samples': SW.projectFile.pickSample })[p](); return; }
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
