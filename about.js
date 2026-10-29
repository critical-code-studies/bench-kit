/*
 * about.js - the About box: the bench's project and its leads, version and release date (the
 * bench-date meta in index.html), what it is for, how it is built (with this kit), what is
 * inside, its sources, its catalogue of versions, its code and how to cite it, with the
 * welcome tour. The bench's own rows come from SW.BENCH.about:
 *   { icon (HTML), project (HTML, the first row: the project and its leads),
 *     cite: { authors (the leads as cited: 'Berry, D. M. and Jonik, M.'), title },
 *     author and citeAuthor (the citation's author where cite.authors is not given),
 *     purpose, techMore, inside, sources, code,
 *     catalogue: { skip: [version ids not counted], held: 'held as source' },
 *     doi (the DOI of every version, Zenodo's concept DOI: a DOI row, and the citation ends with it
 *     in place of the bench's address), doiVersion (this release's own, shown in the row), doiBadge
 *     (the badge's image: by default Zenodo's for the DOI; https://zenodo.org/badge/<GitHub repository
 *     id>.svg shows the latest release's) }
 * The kit places the badge: in the About box's DOI row, and (tools/release.js) at the foot of the
 * README. Without a DOI the row says so, with the link to set one up on Zenodo.
 * SW.about.open() shows it.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW;

  var TECH = 'HTML, CSS and JavaScript, with no build step, served by GitHub Pages. Annotations through Hypothesis; your settings, drafts and My notes are kept in this browser (Back up my data saves them).';
  var KIT = 'the modules shared by the critical code studies research benches.';

  function cfg() { var B = SW.BENCH || {}; return { B: B, A: B.about || {} }; }
  function dateOf() { var dm = document.querySelector('meta[name="bench-date"]'); return dm ? dm.content : ''; }

  function catalogue(A) {
    var V = root.SWVersions; if (!V) return '';
    var c = A.catalogue || {}, skip = c.skip || [];
    var vs = V.VERSIONS.filter(function (v) { return skip.indexOf(v.id) < 0; });
    return vs.length + ' versions: ' + vs.filter(function (v) { return v.build; }).length + ' ' + (c.held || 'held as source') + ', ' +
      vs.filter(function (v) { return v.status === 'lost'; }).length + ' lost.';
  }
  // the bench cited as the project's work: its leads and title from about.cite, where the bench gives them
  function citation(B, A) {
    var date = dateOf(), url = SW.BASE_URI || location.href.split('?')[0], C = A.cite || {};
    return (C.authors || A.citeAuthor || A.author || '') + ' (' + (date ? date.slice(0, 4) : new Date().getFullYear()) + ') ' + (C.title || B.title || 'Research Bench') +
      ' (version ' + SW.VERSION + ').' + (A.doi ? ' Zenodo. Available at: https://doi.org/' + A.doi : ' Available at: ' + url) + ' (Accessed: ' + SW.fmtDate(SW.today()) + ').';
  }
  // the DOI row: the badge (Zenodo's for the DOI, or the bench's own) and the DOIs; without a DOI, where to get one
  var ZENODO_GITHUB = 'https://zenodo.org/account/settings/github/';
  SW.doiBadge = function (A) { return A.doiBadge || (A.doi ? 'https://zenodo.org/badge/DOI/' + A.doi + '.svg' : ''); };
  function doiRow(A) {
    if (!A.doi) return '<span class="faint">None yet. Zenodo gives a bench its DOI when a GitHub Release of the bench\'s repository is archived.</span> <a href="' + ZENODO_GITHUB + '" target="_blank" rel="noopener">Set it up on Zenodo ↗</a>';
    // the badge's bright colours are let down on a dark theme, so they do not outshine the box; full on hover
    var dim = SW.themeInfo && SW.themeInfo().dark ? ' dim' : '';
    return '<a class="about-badge' + dim + '" href="https://doi.org/' + SW.esc(A.doi) + '" target="_blank" rel="noopener"><img src="' + SW.esc(SW.doiBadge(A)) + '" alt="DOI ' + SW.esc(A.doi) + '" height="20"></a><br>' +
      doiLink(A.doi) + ' <span class="faint">every version</span>' + (A.doiVersion ? ' · ' + doiLink(A.doiVersion) + ' <span class="faint">this version</span>' : '');
  }
  function doiLink(d) { return '<a href="https://doi.org/' + SW.esc(d) + '" target="_blank" rel="noopener">' + SW.esc(d) + ' ↗</a>'; }
  function row(label, html, attrs) { return html ? '<tr' + (attrs || '') + '><td>' + SW.esc(label) + '</td><td>' + html + '</td></tr>' : ''; }

  function open() {
    var c = cfg(), B = c.B, A = c.A, date = dateOf();
    var old = SW.$('#dlg-about'); if (old) old.remove();
    var cite = citation(B, A), code = A.code ? '<a href="' + SW.esc(A.code) + '" target="_blank" rel="noopener">' + SW.esc(A.code.replace(/^https?:\/\//, '')) + ' ↗</a>' : '';
    var d = SW.el('dialog', { id: 'dlg-about' });
    d.innerHTML = '<form method="dialog" class="settings about-box">' +
      '<div class="about-head">' + (A.icon || '') + '<div><h2>' + SW.esc(B.title || 'Research Bench') + '</h2><div class="hint">Version ' + SW.esc(SW.VERSION) + (date ? ', ' + SW.esc(SW.fmtDate(date)) : '') + '</div></div></div>' +
      '<table class="about-meta">' +
        row('Project', A.project || '') +
        row('Version', SW.esc(SW.VERSION)) +
        row('Released', date ? SW.esc(SW.fmtDate(date)) : '') +
        row('Purpose', A.purpose || '') +
        row('Tech stack', TECH + (A.techMore ? ' ' + A.techMore : '')) +
        row('Bench kit', 'bench-kit ' + SW.esc(SW.KIT.version) + ', ' + KIT + ' <a href="' + SW.KIT.url + '" target="_blank" rel="noopener">github.com/critical-code-studies/bench-kit ↗</a>', ' data-kit') +
        row('Inside', A.inside || '') +
        row('Sources', A.sources || '') +
        row('Catalogue', SW.esc(catalogue(A))) +
        row('Code', code) +
        row('DOI', doiRow(A)) +
        '<tr><td>Cite as</td><td class="about-cite">' + SW.esc(cite) + '</td></tr>' +
      '</table>' +
      '<div class="row">' + (SW.tours ? '<button type="button" class="btn ghost" data-about="tour">Take the welcome tour</button>' : '') +
        '<button type="button" class="btn ghost" data-about="cite">Copy citation</button><button value="close" class="btn">Close</button></div>' +
      '<a class="about-kitmark" href="' + SW.KIT.url + '" target="_blank" rel="noopener" title="bench-kit ' + SW.esc(SW.KIT.version) + ', the modules this bench is built on">A Bench Kit project</a></form>';
    document.body.appendChild(d);
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-about]'); if (!b) return;
      if (b.dataset.about === 'tour') { d.close(); SW.tours.start('welcome'); }
      else SW.copyText(cite, 'the citation');
    });
    d.addEventListener('close', function () { d.remove(); });
    d.showModal();
  }

  SW.about = { open: open, citation: function () { var c = cfg(); return citation(c.B, c.A); } };
})(typeof window !== 'undefined' ? window : globalThis);
