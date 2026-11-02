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
 * Read ▾ (a tab button with data-menu="read" data-tabs="read"): from another view a click goes back to
 * Read where it was left, and its ▾ (or a click in Read) opens the menu. It lists the versions in the version
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
 * SW.BENCH.menusOff leaves out what a bench does not want in its tab row: a name alone is a menu or a
 * tab ('file', 'topics', 'paratexts'), 'menu:pick' one item of a menu ('help:sitemap', 'file:backup',
 * 'text:6' for lens 6 in Text ▾). A submenu or group left empty goes with its items. A view left out
 * of the tab row can still be opened by a link to it. SW.menuOff(which, pick) says whether one is off.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH;
  function H() { return B.menus || {}; }
  function OFF() { return (B.menusOff || []).map(String); }
  SW.menuOff = function (which, pick) { return OFF().indexOf(pick == null ? String(which) : which + ':' + pick) >= 0; };
  function kept(which) { return function (h) { return !SW.menuOff(which, h[0]); }; }
  // the menus and tabs left out of the tab row
  SW.$$('#tabs [data-menu], #tabs [data-tab]').forEach(function (b) { if (SW.menuOff(b.dataset.menu || b.dataset.tab)) b.remove(); });
  var FILE_ON = B.fileMenu !== false && !SW.menuOff('file');
  // Read is a plain tab: one click goes to the version being read, at its place. Versions are opened
  // from File ▾ ▸ Open a version… (or Versions ▾, where the bench has no File ▾), and the picker in
  // the top bar. A bench that sets readMenu: true keeps Read ▾ as it was.
  if (B.readMenu !== true) SW.$$('#tabs [data-menu="read"]').forEach(function (b) {
    b.removeAttribute('data-menu'); b.removeAttribute('data-tabs'); b.removeAttribute('aria-expanded');
    b.setAttribute('data-tab', 'read'); b.textContent = 'Read'; b.title = 'Read the version open, where you left it (File ▾ ▸ Open a version… for another)';
  });
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
  var OPEN = ['open', 'Open a version…', (/Mac|iPhone|iPad/.test(navigator.platform || '') ? '⌘' : 'Ctrl-') + 'O · the versions in their groups, and their files'];
  function FILE() {
    var groups = [[OPEN], projectItems(), H().file || [],
                  [['backup', 'Back up my data', ''], ['restore', 'Restore my data (non-destructive)', '']]];
    return groups.map(function (g) { return g.filter(kept('file')); }).filter(function (g) { return g.length; });
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
      .concat(FILE_ON ? [] : [OPEN].concat(projectItems()));   // in File ▾, where the bench has it
  }
  // the items of a menu drawn as HTML that the bench has turned off, and what they leave empty: a
  // submenu or a lens group with no items, a group's heading with none under it, a rule with nothing
  // on one side of it
  function prune(el, which) {
    if (!OFF().some(function (o) { return o.indexOf(which + ':') === 0; })) return;
    SW.$$('[data-pick], [data-l]', el).forEach(function (b) { if (SW.menuOff(which, b.dataset.pick || b.dataset.l)) b.remove(); });
    SW.$$('.menu-sub, .lens-g', el).reverse().forEach(function (g) { if (!g.querySelector('[data-pick], [data-l]')) g.remove(); });
    SW.$$('.menu-group', el).forEach(function (h) { var n = h.nextElementSibling; if (!n || n.matches('hr, .menu-group')) h.remove(); });
    SW.$$('hr.menu-rule', el).forEach(function (r) { var n = r.nextElementSibling, p = r.previousElementSibling; if (!n || !p || n.matches('hr')) r.remove(); });
  }
  SW.menuPrune = prune;
  function HELP() {
    var repo = (B.repo || (B.about || {}).code || '').replace(/^https?:\/\//, '');
    var ex = (B.refHelp || {}).example;
    return [['Reading the bench', [['tour', 'Take the welcome tour', 'A few stops through the bench'],
                                 ['refs', 'Referencing and versions', ex ? 'How the bench cites a source, as ' + ex : 'How the bench cites a source']]
                                .concat(B.reading ? [['reading', 'What you should read', (B.reading || {}).menu || 'The reading behind the bench']] : [])
                                .concat(B.cards ? [['cards', 'Reconstruction cards', (B.cards || {}).menu || 'What the bench does to each version to read and run it']] : [])
                                .concat(B.topics && !SW.menuOff('topics') ? [['topics', 'Topic models', 'The Topics tab: the models, their topics, and how far to trust them']] : [])
                                .concat([['marks', 'Marks and conventions', 'Losses, restorations and doubtful readings: the marks, and their Leiden forms']])
                                .concat(B.sitemap ? [['sitemap', 'Site map', 'Every view and version as a plain link']] : [])],
            ['Annotating and sharing', [['join', 'Joining the annotation group', 'An invitation, a Hypothesis account and your tokens, step by step'],
                                        ['anno', 'Advanced annotation', 'Rich text, and links between annotations across versions'],
                                        ['codes', 'Codes, links and sharing', 'Every item’s code, links in annotations, Share, Findings and My notes'],
                                        ['paratexts', 'Paratexts', 'Scans and documents: collections, views, metadata, links']]
                                       .concat(B.implementations ? [['implementations', 'Implementations', 'Ports, translations and reimplementations: their descent, features and comparison']] : [])],
            ['Your bench', [['settings', 'Settings', 'Initials, group, theme, fonts'],
                            ['backup', 'Back up my data', ''],
                            ['restore', 'Restore my data (non-destructive)', '']]],
            ['The project', [['code', 'Source code on GitHub ↗', repo],
                             ['issue', 'Report a problem ↗', 'GitHub issues'],
                             ['about', 'About the bench', 'Version, sources, citation']]]];
  }

  // Help ▾ as the bench has it: the kit's list with the bench's changes, or the bench's own list
  function helpList() {
    return helpAll().map(function (g) { return [g[0], g[1].filter(kept('help'))]; }).filter(function (g) { return g[1].length; });
  }
  function helpAll() {
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

  // ---------- Open a version ----------
  // A box laid out as a chooser: folders on the left (Recent, then the version picker's groups, or for
  // a bench in layers each layer and its groups), the versions on the right with the columns the bench
  // has (name, date, reference, medium), each opening to its files; a search over name, date and
  // reference. Double-click or Enter opens one in Read at its kept place (a file, at that file); the
  // arrow keys move, → and ← open and close a version's files, Esc closes. A choice is a step on the
  // way back (SW.trail). ⌘O or Ctrl-O opens it.
  var V = root.SWVersions;
  function recent() {
    var ks = Object.keys(SW.store.get('read.places', {}) || {}).reverse(), last = SW.store.get('read.last', ''), out = [];
    [last].concat(ks).forEach(function (id) { if (id && out.indexOf(id) < 0 && V.byId(id)) out.push(id); });
    return out.map(V.byId);
  }
  function folders() {
    var all = V.VERSIONS.slice().sort(function (a, b) { return a.sort - b.sort; }), F = [{ id: 'recent', label: 'Recent', vs: recent() }];
    if (SW.layers && SW.layers.list().length) {
      var C2 = B.layers || {}, order = (C2.readOrder || []).map(SW.layers.byId).filter(Boolean);
      SW.layers.list().forEach(function (l) { if (order.indexOf(l) < 0) order.push(l); });
      order.forEach(function (l) {
        var ws = C2.shown ? C2.shown(l.id, SW.layers.versionsOf(l.id)) : SW.layers.versionsOf(l.id);
        var more = typeof l.more === 'function' ? l.more() : l.more || [];
        F.push({ id: 'L:' + l.id, label: l.label, note: l.below ? (l.relation || 'on') + ' ' + ((SW.layers.byId(l.below) || {}).label || '') : '', vs: ws, more: more.length ? more : null });
        (l.groups || []).forEach(function (g, i) {
          var line = g.line ? (V.LINES || []).filter(function (x) { return x.id === g.line; })[0] : null, gids = g.ids || (line ? line.ids : []);
          var gv = ws.filter(function (v) { return gids.indexOf(v.id) >= 0; });
          if (gv.length) F.push({ id: 'L:' + l.id + ':' + i, label: g.label, note: g.note || '', vs: gv, sub: true });
        });
      });
    } else {
      var groups = SW.versionGroups ? SW.versionGroups('Versions') : B.forks && B.forks.length ? B.forks : [[null, 'Versions']];   // the shell's, where it is loaded
      var inG = SW.inGroup || function (v, g) { return g[0] == null || v.fork === g[0]; };
      groups.forEach(function (g, i) { var vs = all.filter(function (v) { return inG(v, g); }); if (vs.length) F.push({ id: 'G:' + i, label: g[1], vs: vs }); });
    }
    return F;
  }
  function fileName(src) { return String(src).split('/').pop(); }
  var ovState = { folder: null, open: {}, q: '' };
  SW.openVersion = function () {
    var d = SW.$('#dlg-open');
    if (!d) {
      d = SW.el('dialog', { id: 'dlg-open', class: 'set-dlg ov-dlg', 'aria-label': 'Open a version' });
      d.innerHTML = '<form method="dialog" class="settings"><div class="ov-head"><h2>Open a version</h2><input type="search" class="ov-q" placeholder="Find by name, date or reference" aria-label="Find a version"></div>' +
        '<div class="ov-body"><nav class="ov-folders" aria-label="Groups"></nav><div class="ov-list" role="listbox" tabindex="0" aria-label="Versions"></div></div>' +
        '<div class="row"><span class="hint ov-hint">Double-click or Enter opens a version in Read where you left it; ▸ shows its files.</span><button value="cancel" class="btn ghost">Close</button> <button type="button" class="btn ov-go">Open</button></div></form>';
      document.body.appendChild(d);
      wireOpen(d);
    }
    var F = folders();
    if (!ovState.folder || !F.some(function (f) { return f.id === ovState.folder; })) {
      var cur = SW.state.v, home = F.filter(function (f) { return f.id !== 'recent' && !f.sub && f.vs.some(function (v) { return v.id === cur; }); })[0];
      ovState.folder = F[0].vs.length ? 'recent' : (home || F[1] || F[0]).id;
    }
    ovState.q = ''; SW.$('.ov-q', d).value = '';
    drawOpen(d);
    d.showModal();
    setTimeout(function () { var on = SW.$('.ov-row.on', d) || SW.$('.ov-row', d); if (on) { on.scrollIntoView({ block: 'nearest' }); } SW.$('.ov-list', d).focus(); }, 0);
  };
  function cols(vs) {
    var any = function (f) { return vs.some(function (v) { return f(v); }); };
    return { date: any(function (v) { return v.date; }), ref: any(function (v) { return v.build; }), medium: any(function (v) { return v.medium; }) };
  }
  function drawOpen(d) {
    var F = folders(), q = ovState.q.trim().toLowerCase(), cur = SW.state.v, sel = ovState.sel || cur;
    SW.$('.ov-folders', d).innerHTML = F.map(function (f) {
      return '<button type="button" class="ov-folder' + (f.sub ? ' sub' : '') + (!q && f.id === ovState.folder ? ' on' : '') + '" data-f="' + SW.esc(f.id) + '"><span class="ov-ico">' + (f.id === 'recent' ? '🕘' : '🗀') + '</span>' + SW.esc(f.label) + ' <span class="hint">' + f.vs.length + '</span></button>';
    }).join('');
    var folder = F.filter(function (f) { return f.id === ovState.folder; })[0] || F[0];
    var vs = q ? V.VERSIONS.slice().sort(function (a, b) { return a.sort - b.sort; }).filter(function (v) { return [v.label, v.date, v.build ? SW.refText(v.id) : '', v.id].join(' ').toLowerCase().indexOf(q) >= 0; }) : folder.vs;
    var c = cols(vs.length ? vs : V.VERSIONS);
    var head = '<div class="ov-row ov-th" aria-hidden="true"><span class="ov-tw"></span><span class="ov-name">Name</span>' + (c.date ? '<span class="ov-date">Date</span>' : '') + (c.ref ? '<span class="ov-ref">Reference</span>' : '') + (c.medium ? '<span class="ov-med">Medium</span>' : '') + '</div>';
    var rows = vs.map(function (v) {
      var parts = v.build || [], open = ovState.open[v.id], lost = !v.build;
      var r = '<div class="ov-row' + (v.id === sel ? ' on' : '') + (v.id === cur ? ' cur' : '') + (lost ? ' lost' : '') + '" role="option" data-v="' + SW.esc(v.id) + '" title="' + SW.esc(v.label + (lost ? ': lost, known from the record' : '')) + '">' +
        '<span class="ov-tw">' + (parts.length ? '<button type="button" class="ov-twist" data-tw="' + SW.esc(v.id) + '" aria-label="Its files">' + (open ? '▾' : '▸') + '</button>' : '') + '</span>' +
        '<span class="ov-name">' + SW.esc(v.label) + (v.id === cur ? ' <span class="hint">· open</span>' : '') + '</span>' +
        (c.date ? '<span class="ov-date">' + SW.esc(v.date || '') + '</span>' : '') + (c.ref ? '<span class="ov-ref mono">' + SW.esc(v.build ? SW.refText(v.id) : '') + '</span>' : '') +
        (c.medium ? '<span class="ov-med">' + SW.esc(lost ? 'lost' : v.medium || '') + '</span>' : '') + '</div>';
      if (open) r += fileRows(v);
      return r;
    }).join('');
    var more = !q && folder.more ? '<div class="ov-more">' + folder.more.map(function (m) { return '<button type="button" class="btn ghost" data-more="' + SW.esc(m[0]) + '" title="' + SW.esc(m[2] || '') + '">' + SW.esc(m[1]) + '</button>'; }).join(' ') + '</div>' : '';
    SW.$('.ov-list', d).innerHTML = head + (rows || '<p class="hint">No version matches.</p>') + more;
  }
  // a version's files, by the bench's groups of them (readFiles) where it has them
  function fileRows(v) {
    var parts = (v.build || []).map(function (b, i) { return [b, i]; }), RF = B.readFiles, out = '', used = {};
    function row(x) { return '<div class="ov-row ov-file" role="option" data-v="' + SW.esc(v.id) + '" data-p="' + x[1] + '"><span class="ov-tw"></span><span class="ov-name">' + SW.esc(fileName(x[0].src)) + ' <span class="hint">' + SW.esc(RF && RF.about ? RF.about(x[0].src, x[0].role) : x[0].role || '') + '</span></span></div>'; }
    if (RF && RF.groups) {
      var stem = function (src) { return fileName(src).replace(/\.[^.]*$/, '').replace(/\.\d+$/, '').toLowerCase(); };
      RF.groups.forEach(function (g) {
        var fs = g.test ? parts.filter(function (x) { return !used[x[1]] && g.test.test(stem(x[0].src)); }) : [];
        fs.forEach(function (x) { used[x[1]] = 1; });
        if (g.rest) fs = fs.concat(parts.filter(function (x) { return !used[x[1]] && !RF.groups.some(function (h) { return h.test && h.test.test(stem(x[0].src)); }); }));
        if (fs.length) out += '<div class="ov-fgroup">' + SW.esc(g.label) + '</div>' + fs.map(row).join('');
      });
      return out;
    }
    return parts.map(row).join('');
  }
  function openIt(d, row) {
    var id = row.dataset.v, v = V.byId(id), p = row.dataset.p;
    d.close();
    if (id !== SW.state.v && SW.trail) SW.trail.from();
    if (p != null) { SW.openAt(id, { p: +p, n0: 1 }); return; }   // a file: Read at its head
    if (SW.nav && SW.layers && SW.layers.list().length && v && v.build) { SW.nav.go({ v: id, p: null, n: null }); SW.setTab('read'); return; }
    if (id !== SW.state.v) SW.select(id);
    SW.trail.quietly(function () { SW.setTab(v && v.build ? 'read' : 'about'); });   // a lost version: its record
  }
  function wireOpen(d) {
    var list = SW.$('.ov-list', d);
    function rows() { return SW.$$('.ov-row[data-v]', list); }
    function mark(r) { rows().forEach(function (x) { x.classList.toggle('on', x === r); }); if (r) { r.scrollIntoView({ block: 'nearest' }); if (!r.dataset.p) ovState.sel = r.dataset.v; } }
    d.addEventListener('click', function (e) {
      var f = e.target.closest('[data-f]'); if (f) { ovState.folder = f.dataset.f; ovState.q = ''; SW.$('.ov-q', d).value = ''; drawOpen(d); return; }
      var t = e.target.closest('[data-tw]'); if (t) { ovState.open[t.dataset.tw] = !ovState.open[t.dataset.tw]; drawOpen(d); return; }
      var m = e.target.closest('[data-more]'); if (m) { d.close(); if (H().pick) H().pick('read', m.dataset.more); else if (B.layers && B.layers.pick) B.layers.pick(m.dataset.more); return; }
      if (e.target.closest('.ov-go')) { var on = SW.$('.ov-row.on', list); if (on) openIt(d, on); return; }
      var r = e.target.closest('.ov-row[data-v]'); if (r) mark(r);
    });
    list.addEventListener('dblclick', function (e) { var r = e.target.closest('.ov-row[data-v]'); if (r && !e.target.closest('[data-tw]')) openIt(d, r); });
    SW.$('.ov-q', d).addEventListener('input', function (e) { ovState.q = e.target.value; drawOpen(d); });
    d.addEventListener('keydown', function (e) {
      var rs = rows(), on = SW.$('.ov-row.on', list), i = rs.indexOf(on);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); mark(rs[Math.max(0, Math.min(rs.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))] || rs[0]); }
      else if (e.key === 'Enter' && on && !e.target.matches('button')) { e.preventDefault(); openIt(d, on); }
      else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && on && !on.dataset.p && !e.target.matches('input')) {
        e.preventDefault(); var id = on.dataset.v; ovState.open[id] = e.key === 'ArrowRight'; drawOpen(d); mark(SW.$('.ov-row[data-v="' + id + '"]:not([data-p])', list));
      }
    });
  }
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && (e.key === 'o' || e.key === 'O')) { e.preventDefault(); if (!document.querySelector('dialog[open]')) SW.openVersion(); }
  });

  function closeTabMenu() { if (!tabMenu) return; tabMenu.el.remove(); tabMenu.btn.setAttribute('aria-expanded', 'false'); tabMenu = null; }
  // what a submenu holds, in brief: its first items' names
  function firstOf(list) { return list.slice(0, 3).map(function (h) { return h[1].replace(/ ↗$/, ''); }).join(', ') + (list.length > 3 ? '…' : ''); }
  SW.menuFirst = firstOf;
  function item(h, on) { return '<button data-pick="' + SW.esc(h[0]) + '"' + (on ? ' class="on"' : '') + '><b>' + SW.esc(h[1]) + '</b>' + (h[2] ? '<span>' + SW.esc(h[2]) + '</span>' : '') + '</button>'; }   // an item with no line under it, where none is given

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
    if (which === 'versions') return (H().versions || VERSIONS()).filter(kept('versions')).map(function (h) {
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
    if (which === 'read' && /^v:/.test(p)) { if (p.slice(2) !== SW.state.v) { if (SW.trail) SW.trail.from(); SW.select(p.slice(2)); } SW.setTab('read'); return; }   // another version: a step on the way back
    if ((which === 'file' || which === 'versions') && p === 'open') { SW.openVersion(); return; }
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
      // Read from another view: back to Read where it was left (its place is kept); the ▾, or a click
      // while in Read, opens the menu
      if (btn.dataset.tabs === 'read' && SW.state.tab !== 'read' && !e.target.closest('.caret')) {
        closeTabMenu(); SW.trail.quietly(function () { SW.setTab('read'); }); return;
      }
      if (tabMenu && tabMenu.btn === btn) { closeTabMenu(); return; }
      closeTabMenu();
      var r = btn.getBoundingClientRect(), el = SW.el('div', { class: 'tab-menu lens-list', role: 'menu', 'data-w': which }, menuHTML(which));
      prune(el, which);
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
        SW.trail.quietly(function () { pick(which, t.dataset.pick); });   // the reader's own choice: no step back
      });
    });
  });
  document.addEventListener('mousedown', function (e) { if (tabMenu && !tabMenu.el.contains(e.target) && !tabMenu.btn.contains(e.target)) closeTabMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTabMenu(); });
  window.addEventListener('resize', closeTabMenu);
})(typeof window !== 'undefined' ? window : globalThis);
