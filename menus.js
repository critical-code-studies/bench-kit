/*
 * menus.js - the drop-down menus in the tab row: a button in #tabs with data-menu="<name>" opens
 * a menu under it (a click outside, or Esc, closes it). Versions and Help are the kit's; the
 * lenses' menus are kit/lenses.js's (SW.BENCH.lenses.menus); the bench's own (graphics) it draws
 * itself. From SW.BENCH.menus:
 *   versions          [[pick, label, text]]: Versions ▾ (by default This version, Compare,
 *                     Genealogy); a pick that is a view goes to it
 *   help              [[group, [[pick, label, text]]]]: Help ▾, its groups (by default the
 *                     template's); a pick opens the Help item of that name (SW.help, kit/shell.js)
 *   menu(which)       HTML for a menu of the bench's own (buttons with data-pick), or null
 *   pick(which, p)    a pick the bench handles itself (a graphic, a Versions item that
 *                     is not a view); true when it has
 *   on(which, p)      whether a Versions item is the one open, where it is not a view
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
    return [['Getting started', [['tour', 'Take the welcome tour', 'A few stops through the bench'],
                                 ['refs', 'Referencing and versions', ex ? 'How the bench cites a source, as ' + ex : 'How the bench cites a source']]
                                .concat(B.reading ? [['reading', 'What you should read', (B.reading || {}).menu || 'The reading behind the bench']] : [])
                                .concat(B.cards ? [['cards', 'Reconstruction cards', (B.cards || {}).menu || 'What the bench does to each version to read and run it']] : [])
                                .concat([['join', 'Joining the annotation group', 'An invitation, a Hypothesis account and your tokens, step by step'],
                                         ['anno', 'Advanced annotation', 'Rich text, and links between annotations across versions'],
                                         ['codes', 'Codes, links and sharing', 'Every item’s code, links in annotations, Share, Findings and My notes'],
                                         ['paratexts', 'Paratexts', 'Scans and documents: collections, views, metadata, links']])],
            ['Your bench', [['settings', 'Settings', 'Initials, group, theme, fonts'],
                            ['backup', 'Back up everything', 'Notes, drafts, settings and findings in one file'],
                            ['restore', 'Restore from a backup…', 'Brings back notes and drafts beside those here']]],
            ['The project', [['code', 'Source code on GitHub ↗', repo],
                             ['issue', 'Report a problem ↗', 'GitHub issues'],
                             ['about', 'About the bench', 'Version, sources, citation']]]];
  }

  var tabMenu = null;
  function closeTabMenu() { if (!tabMenu) return; tabMenu.el.remove(); tabMenu.btn.setAttribute('aria-expanded', 'false'); tabMenu = null; }
  function item(h, on) { return '<button data-pick="' + SW.esc(h[0]) + '"' + (on ? ' class="on"' : '') + '><b>' + SW.esc(h[1]) + '</b><span>' + SW.esc(h[2]) + '</span></button>'; }

  function menuHTML(which) {
    if (which === 'help') {
      var dm = document.querySelector('meta[name="bench-date"]');
      // grouped, with a divider and a small heading between the groups; About the bench last
      return (H().help || HELP()).map(function (g, i) {
        return (i ? '<hr class="menu-rule">' : '') + '<div class="menu-group">' + SW.esc(g[0]) + '</div>' + g[1].map(function (h) { return item(h); }).join('');
      }).join('') + '<div class="help-ver hint">' + SW.esc(B.title) + ' ' + SW.esc(SW.VERSION) + (dm ? ', ' + SW.esc(SW.fmtDate(dm.content)) : '') + '</div>';
    }
    if (which === 'versions') return (H().versions || VERSIONS).map(function (h) {
      var on = H().on && H().on(which, h[0]); if (on == null && SW.lenses) on = SW.lenses.on(which, h[0]); if (on == null) on = SW.state.tab === h[0];
      return item(h, on);
    }).join('');
    var lm = SW.lenses ? SW.lenses.menuHTML(which) : null; if (lm != null) return lm;   // kit/lenses.js
    return H().menu ? H().menu(which) || '' : '';
  }
  function pick(which, p) {
    if (H().pick && H().pick(which, p)) return;
    if (SW.lenses && SW.lenses.pick(which, p)) return;
    if (which === 'help') { SW.help(p); return; }
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
