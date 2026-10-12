/*
 * shell.js - the bench's frame: start-up, the version picker, the tabs and the views drawn in
 * them, the colour theme, the buttons of the top bar, and what a link asks for (?v= version,
 * &tab=, &l= lines, &b= Compare's other version, &a= an annotation, &code=, &help=, &tour=,
 * &join=, &tr= a tracing). Loaded last. The bench's own parts come from SW.BENCH.shell:
 *   views         the views, in the order of the tabs (each has a section #view-<name>)
 *   alias         old view names and the views they became ({ sky: 'graphics' })
 *   redraw        the views drawn again when the theme changes (figures are coloured as drawn)
 *   lang(v)       { text, title } for #vlang beside the picker: the version's language
 *   versionTitle  true: the window's title names the version (else it keeps the bench's name)
 *   onSelect(b)   after a version is built; onTheme(t) after the theme changes
 *   query(q)      the bench's own parts of a link (a lens, a graphic, a view's settings), before
 *                 the view is chosen; it may set q.tab
 *   help          { name: fn } the bench's own Help items a link can open (&help=name)
 * and from SW.BENCH: forks (the picker's groups: [[fork, label]]), start (the version shown
 * first), examples.finding (in the code box). The bench's views register in SW.views
 * ({ show(b), hide(), enter(b) }).
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, V = root.SWVersions, B = SW.BENCH;
  function H() { return B.shell || {}; }
  function ORDER() { return H().views || ['read']; }

  function fillPicker() {
    var sel = SW.$('#pick-a');
    var groups = B.forks || [[null, 'Versions']];
    sel.innerHTML = groups.map(function (g) {
      var vs = V.VERSIONS.filter(function (v) { return g[0] == null || v.fork === g[0]; })
        .sort(function (a, b) { return a.sort - b.sort; });
      if (!vs.length) return '';
      return '<optgroup label="' + SW.esc(g[1]) + '">' + vs.map(function (v) {
        return '<option value="' + SW.esc(v.id) + '">' + SW.esc((v.build ? '[' + SW.refOf(v.id) + '] ' : '') + v.label + ' · ' + v.date) +
          (v.status === 'lost' ? ' (lost)' : v.status === 'reconstructed' ? ' (reconstruction)' : '') + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    sel.onchange = function () { select(sel.value); };
  }

  // A menu in the tab row is lit when the view open is one of its items (data-tabs; for the
  // analyse view, the lenses SW.BENCH.lenses.menus puts in that menu).
  function lensesIn(menu) {
    return (((B.lenses || {}).menus || {})[menu] || []).reduce(function (a, g) { return a.concat(g[1].map(String)); }, []);
  }
  SW.markTabs = function () {
    var tab = SW.state.tab, lens = String(SW.anLens ? SW.anLens() : '');
    SW.$$('#tabs button').forEach(function (b) {
      var on = b.dataset.tabs ? b.dataset.tabs.split(' ').indexOf(tab) >= 0 && (tab !== 'analyse' || lensesIn(b.dataset.menu).indexOf(lens) >= 0) : b.dataset.tab === tab;
      b.classList.toggle('on', on);
    });
  };
  SW.setTab = function (tab) {
    tab = (H().alias || {})[tab] || tab;
    if (ORDER().indexOf(tab) < 0) tab = 'read';
    var prev = SW.state.tab;
    if (prev !== tab && SW.views[prev] && SW.views[prev].hide) SW.views[prev].hide();
    SW.state.tab = tab;
    document.body.dataset.tab = tab;
    SW.markTabs();
    SW.$$('.view').forEach(function (v) { v.classList.toggle('on', v.id === 'view-' + tab); });
    SW.writeQuery();
    showCurrent();
  };

  var shown = {};
  // Drop a view's drawing so the next visit draws it afresh.
  SW.forget = function (tab) { delete shown[tab]; };
  function showCurrent() {
    var tab = SW.state.tab, id = SW.state.v;
    if (!id) return;
    SW.build(id).then(function (b) {
      if (SW.state.v !== id) return;
      var view = SW.views[tab];
      if (!view) { SW.$('#view-' + tab).innerHTML = '<div class="pad hint">This view is being built and will arrive in the next update.</div>'; return; }
      if (shown[tab] !== b || tab === 'about' || tab === 'run' || (tab === 'tape' && SW.state.tapeGo)) { shown[tab] = b; view.show(b); }
      else if (view.enter) view.enter(b);   // a view already drawn, opened again
    }).catch(function (e) {
      SW.$('#view-' + tab).innerHTML = '<div class="pad"><p class="badge err">Could not load</p> ' + SW.esc(e.message) + '</div>';
    });
  }

  function select(id) {
    if (!V.byId(id)) id = B.start || V.VERSIONS.filter(function (v) { return v.build; })[0].id;
    if (SW.state.v && SW.state.v !== id) SW.state.sel = null;
    SW.state.v = id;
    SW.$('#pick-a').value = id;
    var v = V.byId(id), vl = SW.$('#vlang');
    if (vl) { var L = v && v.build && H().lang ? H().lang(v) : null; vl.textContent = L ? L.text : ''; vl.title = L && L.title || ''; }
    var vr = SW.$('#vref'); if (vr) { vr.textContent = v && v.build ? SW.refText(id) : ''; vr.dataset.copy = vr.textContent; vr.title = 'Click to copy. The bench’s reference to this source' + ((H().help || {}).refs ? ' (Help ▸ Referencing and versions)' : ''); }
    shown = {};
    SW.build(id).then(function (b) {
      if (H().onSelect) H().onSelect(b);
      if (H().versionTitle) document.title = b.v.label + ' · ' + B.title;
    }).catch(function (e) { SW.toast(e.message, 5000); });
    SW.writeQuery();
    showCurrent();
  }
  SW.select = select;

  function about() { SW.about.open(); }

  function theme(t) {
    t = SW.themeInfo(t).id;   // an unknown or retired name falls back to the first
    document.documentElement.setAttribute('data-theme', t);
    SW.store.set('theme', t);
    SW.store.set(SW.themeInfo(t).dark ? 'theme.dark' : 'theme.light', t);   // for the ◐ switch
    SW.emit('theme', t);
    // Figures are coloured for the theme when drawn, so draw them again.
    if (SW.state.v) {
      var again = H().redraw || ['analyse', 'compare', 'genealogy', 'findings', 'functional'];
      again.forEach(function (k) { delete shown[k]; });
      if (SW.views.findings && SW.views.findings.reset) SW.views.findings.reset();
      if (again.indexOf(SW.state.tab) >= 0) showCurrent();
      if (H().onTheme) H().onTheme(t);
    }
  }
  SW.setTheme = theme;   // for the kit's Settings

  // the Help items a link can open (&help=name): the kit's, and the bench's (SW.BENCH.shell.help)
  function helpItems() {
    var repo = B.repo || (B.about || {}).code || '';
    var h = { codes: function () { SW.guide('codes'); }, paratexts: function () { SW.guide('paratexts'); }, anno: function () { SW.notes.help(); },
              join: function () { SW.notes.joinHelp(); }, about: about, settings: function () { SW.settings.open(); },
              tour: function () { SW.tours.start('welcome'); }, backup: function () { SW.backup.save(); }, restore: function () { SW.backup.restore(); },
              sitemap: function () { location.href = 'sitemap.html'; },
              code: function () { window.open(repo, '_blank', 'noopener'); }, issue: function () { window.open(repo + '/issues', '_blank', 'noopener'); } };
    // kit/helppages.js: Referencing and versions always, the reading and the cards where the bench has them
    if (SW.refHelp) h.refs = SW.refHelp;
    if (SW.readingHelp && B.reading) h.reading = SW.readingHelp;
    if (SW.cardsHelp && B.cards) h.cards = SW.cardsHelp;
    var own = H().help || {}; Object.keys(own).forEach(function (k) { h[k] = own[k]; });
    return h;
  }
  // open a Help item by name (the Help menu, a link's &help=); false if there is none
  SW.help = function (name) { var h = helpItems()[name]; if (!h) return false; h(); return true; };

  function init() {
    theme(SW.store.get('theme', 'phosphor'));
    fillPicker();
    SW.$('#tabs').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-tab]');
      if (b) SW.setTab(b.dataset.tab);
    });
    SW.$('#btn-settings').onclick = function () { SW.settings.open(); };
    SW.$('#btn-about').onclick = about;
    SW.$('.brand').addEventListener('click', function (e) { e.preventDefault(); about(); });
    // The side panel opens below the top bar, so the bar's buttons stay in reach.
    function barH() { document.documentElement.style.setProperty('--bar-h', SW.$('header.bar').offsetHeight + 'px'); }
    barH();
    window.addEventListener('resize', barH);
    SW.notes.initNews();
    // A drop-down menu near the right edge opens leftwards, so it stays on screen; one too wide to
    // open either way is moved left as far as it needs, and no further than the left edge.
    document.addEventListener('toggle', function (e) {
      var d = e.target;
      if (!d.classList || !d.classList.contains('menu') || !d.open) return;
      var body = d.querySelector('.menu-body');
      if (!body) return;
      body.style.left = ''; body.style.right = '';
      var vw = document.documentElement.clientWidth, r = body.getBoundingClientRect();
      if (r.right <= vw - 4) return;
      var p = (body.offsetParent || d).getBoundingClientRect();
      if (p.right - r.width >= 4) { body.style.left = 'auto'; body.style.right = '0'; }
      else body.style.left = (Math.max(4, vw - 4 - r.width) - p.left) + 'px';
    }, true);
    SW.tray.init();
    SW.applyCodeText();
    SW.applyNoteShade();
    SW.applyPalette();
    SW.$('#btn-smaller').onclick = function () { SW.setCodeSize(SW.codeSize() - 1); };
    SW.$('#btn-larger').onclick = function () { SW.setCodeSize(SW.codeSize() + 1); };
    // ◐: to the last light theme from a dark one, and back.
    SW.$('#btn-theme').onclick = function () {
      theme(SW.themeInfo().dark ? SW.store.get('theme.light', 'paper') : SW.store.get('theme.dark', 'phosphor'));
    };
    SW.$('#drawer-close').onclick = SW.closeDrawer;
    // the tab row, scrolled sideways on a narrow screen: a fade while more lies to the right
    var tabsRow = SW.$('.tabs');
    function tabsFade() { if (tabsRow) tabsRow.classList.toggle('more-right', tabsRow.scrollLeft + tabsRow.clientWidth < tabsRow.scrollWidth - 4); }
    if (tabsRow) { tabsRow.addEventListener('scroll', tabsFade, { passive: true }); window.addEventListener('resize', tabsFade); setTimeout(tabsFade, 0); }
    var q = SW.readQuery();
    // an invitation (join.html#ID → ?join=ID): the group set, the ID taken out of the address, the guide opened
    if (q.join) { SW.notes.join(q.join); delete q.join; q.help = 'join'; try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])join=[^&]*&?/, '$1').replace(/[?&]$/, '')); } catch (e) { /* file: urls */ } }
    if (q.l) {
      var m = /^(\d+):(\d+)(?:-(\d+))?$/.exec(q.l);
      if (m) SW.state.sel = { p: +m[1], n0: +m[2], n1: +(m[3] || m[2]) };
    }
    if (q.b) SW.state.b = q.b;
    if (q.tr) SW.state.trace = q.tr;   // a shared tracing to open (kit/tracings.js)
    if (q.tab) q.tab = (H().alias || {})[q.tab] || q.tab;
    if (q.lens && SW.setLens) { SW.setLens(q.lens); if (!q.tab) q.tab = 'analyse'; }   // a lens (kit/lenses.js)
    if (q.g && SW.setGraphic) { SW.setGraphic(q.g); if (!q.tab) q.tab = 'graphics'; }   // a graphic (kit/graphics.js)
    if (H().query) H().query(q);   // the bench's own: a view's settings
    SW.state.tab = ORDER().indexOf(q.tab) >= 0 ? q.tab : 'read';
    document.body.dataset.tab = SW.state.tab;
    SW.markTabs();
    SW.$$('.view').forEach(function (v) { v.classList.toggle('on', v.id === 'view-' + SW.state.tab); });
    select(q.v || B.start);
    // a link to an annotation: to it, once the version is up
    if (q.a && q.v) setTimeout(function () { SW.notes.follow(q); }, 900);
    // a link to a code (?code=A-MLKH5): to what it names
    if (q.code) setTimeout(function () { SW.notes.goCode(q.code); }, 1000);
    var shb = SW.$('#btn-share'); if (shb) { shb.innerHTML = SW.SHARE_ICON; shb.onclick = function () { SW.share({ title: document.title }); }; }
    SW.$('#btn-code').onclick = function (e) {
      var r = e.currentTarget.getBoundingClientRect(), f = (B.examples || {}).finding || 'F1';
      SW.pop(r.left - 180, r.bottom + 6, '<h4>Go to a code</h4><input type="text" class="code-in mono" placeholder="A-MLKH5, C-FT1A7, P-U1J8Q, ' + SW.esc(f) + ', DMB-N14" autocomplete="off"><p class="hint">An annotation or reply (A-, R-), a group finding (C-), the bench’s (F), a paratext (P-), or a note in My notes (initials-N). A link can carry one: ?code=…</p>');
      var inp = SW.$('.pop .code-in'); if (!inp) return;
      inp.focus();
      inp.addEventListener('keydown', function (k) { if (k.key === 'Enter' && inp.value.trim()) { SW.unpop(); SW.notes.goCode(inp.value); } });
    };
    // a Help item named in the link; the welcome tour from a link (?tour=welcome), or offered on a
    // first visit; else, without initials, the box that asks for them (at most once a week)
    var HELP = helpItems();
    if (HELP[q.help] && ['code', 'issue', 'sitemap', 'backup', 'restore'].indexOf(q.help) < 0) setTimeout(HELP[q.help], 700);
    if (q.tour) setTimeout(function () { SW.tours.start(q.tour); }, 900);
    else if (!SW.store.get('tour.seen', false)) setTimeout(SW.tours.offer, 1200);
    else if (!SW.store.get('initials', '') && Date.now() - (+SW.store.get('ini.later', 0) || 0) > 7 * 864e5) setTimeout(function () { if (!document.querySelector('dialog[open]')) SW.askInitials('Welcome. Annotations, notes and findings are signed with your initials.'); }, 1200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : globalThis);
