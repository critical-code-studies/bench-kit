/*
 * sitemap.js - a bench's site map: every view, menu item and version as a plain link, and each
 * version's source files on GitHub, as a page that works without JavaScript (sitemap.html).
 * It reads the bench as it runs: the tab row, each menu as it opens, the version list, the
 * references and the source links. tools/sitemap.js runs it in a headless browser and writes
 * the page; benches do not load it. From SW.BENCH.sitemap (true, or):
 *   site      [href, label]: the project's own site, beside the link back to the bench
 *   sitePages [[href, label]]: pages of that site, listed under Without the bench
 *   intro     HTML: the opening paragraph (by default, that the bench needs JavaScript and the
 *             files open on GitHub without it)
 *   opens     what a link opens when it names no version (by default, the first version's label)
 *   files     a sentence on the files' order or source
 *   lost      the line for a version with no text ('lost: no copy held')
 *   links     { pick: href }: a menu item that opens a page of its own (Versions ▸ Storage)
 * A version's scans (v.scans, files beside its sources) are listed after its files. The page
 * ends with the source folder, the project's site and the repository, for reading without the
 * bench. SW.sitemapHTML() gives the page.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH, V = root.SWVersions, esc = SW.esc;
  function C() { return typeof B.sitemap === 'object' ? B.sitemap : {}; }

  // a menu in the tab row, as it opens: its group headings and items
  function menuItems(btn) {
    btn.click();
    var m = document.querySelector('.tab-menu'), out = [];
    if (m) SW.$$('.menu-group, .lens-g > h5, [data-pick]', m).forEach(function (e) {
      if (e.dataset.pick == null) { out.push({ sub: e.textContent.trim() }); return; }
      var bEl = e.querySelector('b'), sEl = e.querySelector('span');
      out.push({ pick: e.dataset.pick, name: (bEl || e).textContent.trim(), text: sEl ? sEl.textContent.trim() : '' });
    });
    if (document.querySelector('.tab-menu')) btn.click();
    return out;
  }
  function repo() { return (B.repo || (B.about || {}).code || (B.refs || {}).repo || '').replace(/\/$/, ''); }
  // where an item of menu `which` goes as a link, or null where it is an action, not a place
  function hrefOf(which, pick) {
    var L = C().links || {};
    if (L[pick]) return L[pick];
    if (which === 'help') {
      if (pick === 'tour') return 'index.html?tour=welcome';
      if (pick === 'code') return repo() || null;
      if (pick === 'issue') return repo() ? repo() + '/issues' : null;
      if (pick === 'sitemap' || pick === 'backup' || pick === 'restore') return null;
      return 'index.html?help=' + encodeURIComponent(pick);
    }
    if (/^\d+$/.test(pick)) return 'index.html?lens=' + pick;
    var LP = (B.lenses || {}).picks || {};
    if (LP[pick] != null) return 'index.html?lens=' + LP[pick];   // a Versions item that opens a lens
    if (which === 'graphics') {
      var G = B.graphics || {};
      return (G.list || []).some(function (g) { return g[0] === pick; }) && (G.menuOnly || []).indexOf(pick) < 0 ? 'index.html?g=' + encodeURIComponent(pick) : null;
    }
    return document.getElementById('view-' + pick) ? 'index.html?tab=' + encodeURIComponent(pick) : null;
  }

  // the sources, the project's site and the repository, for reading without the bench
  function without() {
    var c = C(), R = repo(), dir = (B.refs || {}).dir, li = [];
    if (R && dir) li.push('<li><a href="' + esc(R + '/tree/main/' + dir) + '">All the source files on GitHub</a></li>');
    if (c.site) li.push('<li><a href="' + esc(c.site[0]) + '">' + esc(c.site[1]) + '</a>' + (c.sitePages && c.sitePages.length ? ': ' + c.sitePages.map(function (s) { return '<a href="' + esc(s[0]) + '">' + esc(s[1]) + '</a>'; }).join(', ') : '') + '</li>');
    if (R) li.push('<li><a href="' + esc(R) + '">The repository</a> · <a href="' + esc(R + '/issues') + '">Report a problem</a></li>');
    return li.length ? '<h2>Without the bench</h2>\n<ul>\n' + li.join('\n') + '\n</ul>\n' : '';
  }

  SW.sitemapHTML = function () {
    var groups = [['Tabs', []]];
    SW.$$('#tabs > button').forEach(function (b) {
      if (b.dataset.tab) { groups[0][1].push({ href: 'index.html?tab=' + b.dataset.tab, name: b.textContent.trim(), text: b.title || (b.dataset.tab === 'read' ? 'The listing, annotated' : '') }); return; }
      if (!b.dataset.menu) return;
      var g = [b.textContent.replace('▾', '').trim(), []];
      menuItems(b).forEach(function (it) {
        if (it.sub) { g[1].push(it); return; }
        var h = hrefOf(b.dataset.menu, it.pick);
        if (h) g[1].push({ href: h, name: it.name, text: it.text });
      });
      // a heading with nothing under it is dropped
      g[1] = g[1].filter(function (it, i, a) { return !it.sub || (a[i + 1] && !a[i + 1].sub); });
      if (g[1].length) groups.push(g);
    });
    var c = C(), first = V.byId(B.start) || V.VERSIONS[0], run = !!document.getElementById('view-run');
    var n = 0, rows = V.VERSIONS.slice().sort(function (a, b) { return a.sort - b.sort; }).map(function (v) {
      var ref = SW.refOf ? SW.refOf(v.id) : '', open = 'index.html?v=' + encodeURIComponent(v.id);
      if (!v.build || !v.build.length) {
        return '<tr class="lost"><td></td><td class="mono">' + esc(ref) + '</td><td>' + esc(v.label) + '</td><td>' + esc(v.date || '') + '</td><td><a href="' + esc(open) + '&amp;tab=about">Record</a></td><td>' + esc(c.lost || 'lost: no copy held') + '</td></tr>';
      }
      var files = v.build.map(function (f) { var p = f.src || f.tape; return '<a href="' + esc(SW.sourceURL(p)) + '">' + esc(p.split('/').pop()) + '</a>'; })
        .concat((v.scans || []).map(function (p) { return '<a href="' + esc(SW.sourceURL(p)) + '">' + esc(p.split('/').pop()) + '</a> (scan)'; })).join(' · ');
      return '<tr><td class="num">' + (++n) + '</td><td class="mono">' + esc(ref) + '</td><td>' + esc(v.label) + '</td><td>' + esc(v.date || '') + '</td><td><a href="' + esc(open) + '">Read</a>' +
        (run && v.runnable ? ' · <a href="' + esc(open) + '&amp;tab=run">Run</a>' : '') + ' · <a href="' + esc(open) + '&amp;tab=about">Record</a></td><td class="files">' + files + '</td></tr>';
    }).join('\n');
    var title = B.title || 'Research Bench', today = SW.fmtDate ? SW.fmtDate(SW.today()) : new Date().toISOString().slice(0, 10);
    var item = function (it) { return it.sub ? '</ul><p class="sub">' + esc(it.sub) + '</p><ul>' : '<li><a href="' + esc(it.href) + '">' + esc(it.name) + '</a>' + (it.text ? ': ' + esc(it.text) : '') + '</li>'; };
    return '<!DOCTYPE html>\n<html lang="en-GB">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<meta name="robots" content="noindex, nofollow, noarchive">\n<title>Site map · ' + esc(title) + '</title>\n' +
      '<meta name="description" content="Every view of the ' + esc(title) + ' as a plain link, with the versions and their source files.">\n<style>\n' +
      '  :root { --bg: #f6f4ee; --fg: #1d1f24; --dim: #5d6058; --line: #d8d4c8; --link: #2c6e8a; --head: #ece8dc; }\n' +
      '  @media (prefers-color-scheme: dark) { :root { --bg: #11131a; --fg: #e7e4da; --dim: #989b93; --line: #2f333d; --link: #6cc8e8; --head: #171a23; } }\n' +
      '  body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }\n' +
      '  main { max-width: 1100px; margin: 0 auto; padding: 20px 16px 48px; }\n' +
      '  h1 { font-size: 24px; margin: 8px 0 4px; } h2 { font-size: 17px; margin: 26px 0 8px; border-bottom: 1px solid var(--line); padding-bottom: 4px; }\n' +
      '  a { color: var(--link); } p { margin: 6px 0; } .dim, .note { color: var(--dim); } .sub { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: var(--dim); margin: 8px 0 2px; }\n' +
      '  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 4px 24px; }\n' +
      '  .grid h3 { font-size: 14px; margin: 10px 0 2px; } .grid ul { margin: 0; padding-left: 18px; }\n' +
      '  .wrap { overflow-x: auto; } table { border-collapse: collapse; width: 100%; font-size: 13.5px; }\n' +
      '  th, td { text-align: left; vertical-align: top; padding: 5px 8px; border-bottom: 1px solid var(--line); } th { background: var(--head); font-weight: 600; }\n' +
      '  .num { text-align: right; } .mono { font-family: ui-monospace, Menlo, Consolas, monospace; white-space: nowrap; } .files { font-size: 12.5px; } tr.lost td { color: var(--dim); }\n' +
      '  .top a { margin-right: 14px; }\n</style>\n</head>\n<body>\n<main>\n' +
      '<p class="top"><a href="index.html">← The research bench</a>' + (c.site ? '<a href="' + esc(c.site[0]) + '">' + esc(c.site[1]) + '</a>' : '') + '</p>\n' +
      '<h1>Site map</h1>\n<p>' + (c.intro || 'Every view of the ' + esc(title) + ' as a plain link, for when a menu will not open. The bench runs in JavaScript; without it, the source files below open on GitHub.') + '</p>\n' +
      '<p class="dim">Each link opens ' + esc(c.opens || (first ? first.label : 'the first version')) + ' unless it names a version; the version picker at the top of the bench changes it. Any view’s address can be shared as it stands.</p>\n' +
      '<h2>Views</h2>\n<div class="grid">' + groups.map(function (g) { return '<div><h3>' + esc(g[0]) + '</h3><ul>' + g[1].map(item).join('') + '</ul></div>'; }).join('').replace(/<ul><\/ul>/g, '') + '</div>\n' +
      '<h2>Versions and their sources</h2>\n<p class="dim">References as in Help ▸ Referencing and versions.' + (c.files ? ' ' + esc(c.files) : '') + '</p>\n' +
      '<div class="wrap"><table><thead><tr><th>No.</th><th>Reference</th><th>Version</th><th>Dated</th><th>Open</th><th>Source files</th></tr></thead><tbody>\n' + rows + '\n</tbody></table></div>\n' +
      without() +
      '<p class="note">Generated from the bench by bench-kit ' + esc((SW.KIT || {}).version || '') + ', ' + esc(today) + '.</p>\n</main>\n</body>\n</html>\n';
  };
})(typeof window !== 'undefined' ? window : globalThis);
