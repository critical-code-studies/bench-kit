/*
 * about.js - the About box: the bench's name, author, version and release date (the
 * bench-date meta in index.html), what it is for, how it is built (with this kit), what is
 * inside, its sources, its catalogue of versions, its code and how to cite it, with the
 * welcome tour. The bench's own rows come from SW.BENCH.about:
 *   { icon (HTML), author, citeAuthor, project (HTML, a row after Author), purpose, techMore,
 *     inside, sources, code,
 *     catalogue: { skip: [version ids not counted], held: 'held as source' } }
 * SW.about.open() shows it.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW;

  var TECH = 'HTML, CSS and JavaScript, with no build step, served by GitHub Pages. Annotations through Hypothesis; your settings, drafts and My notes are kept in this browser (Help ▸ Back up everything saves them).';
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
  function citation(B, A) {
    var date = dateOf(), url = SW.BASE_URI || location.href.split('?')[0];
    return (A.citeAuthor || A.author || '') + ' (' + (date ? date.slice(0, 4) : new Date().getFullYear()) + ') ' + (B.title || 'Research Bench') +
      ' (version ' + SW.VERSION + '). Available at: ' + url + ' (Accessed: ' + SW.fmtDate(SW.today()) + ').';
  }
  function row(label, html, attrs) { return html ? '<tr' + (attrs || '') + '><td>' + SW.esc(label) + '</td><td>' + html + '</td></tr>' : ''; }

  function open() {
    var c = cfg(), B = c.B, A = c.A, date = dateOf();
    var old = SW.$('#dlg-about'); if (old) old.remove();
    var cite = citation(B, A), code = A.code ? '<a href="' + SW.esc(A.code) + '" target="_blank" rel="noopener">' + SW.esc(A.code.replace(/^https?:\/\//, '')) + ' ↗</a>' : '';
    var d = SW.el('dialog', { id: 'dlg-about' });
    d.innerHTML = '<form method="dialog" class="settings about-box">' +
      '<div class="about-head">' + (A.icon || '') + '<div><h2>' + SW.esc(B.title || 'Research Bench') + '</h2><div class="hint">Version ' + SW.esc(SW.VERSION) + (date ? ', ' + SW.esc(SW.fmtDate(date)) : '') + '</div></div></div>' +
      '<table class="about-meta">' +
        row('Author', SW.esc(A.author || '')) +
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
        '<tr><td>Cite as</td><td class="about-cite">' + SW.esc(cite) + '</td></tr>' +
      '</table>' +
      '<div class="row">' + (SW.tours ? '<button type="button" class="btn ghost" data-about="tour">Take the welcome tour</button>' : '') +
        '<button type="button" class="btn ghost" data-about="cite">Copy citation</button><button value="close" class="btn">Close</button></div></form>';
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
