/*
 * tests/about.test.js - checks of the About box's citation (kit/about.js), run by tests/run.js: the
 * bench's address where it gives no DOI, the DOI where it does; and of This version's "Cite this
 * version" (kit/version.js): the kit's line, and a bench's own wording as a text or a function.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, eq = T.eq, SW = window.SW;
  if (!SW.about || !SW.about.citation) return;
  var A = SW.BENCH.about = SW.BENCH.about || {}, was = A.doi;
  T.group('About: the citation');
  delete A.doi;
  eq('without a DOI: available at the bench\'s address', / Available at: http/.test(SW.about.citation()) && !/doi\.org/.test(SW.about.citation()), true);
  A.doi = '10.5281/zenodo.1';
  eq('with a DOI: Zenodo, and the DOI in place of the address', /\)\. Zenodo\. Available at: https:\/\/doi\.org\/10\.5281\/zenodo\.1 \(Accessed: /.test(SW.about.citation()), true);
  if (was) A.doi = was; else delete A.doi;
  if (!SW.versionCite) return;
  T.group('This version: Cite this version');
  var v = { id: 'zz', label: 'Translation', date: '2026', authors: 'D. M. Berry' }, url = SW.versionURI('zz'), N = SW.BENCH.name;
  eq('the kit\'s line, with no wording of the bench\'s', SW.versionCite(v, undefined), 'Translation (2026). D. M. Berry. ' + N + ' research bench, ' + url);
  eq('a version with no authors has no empty sentence', SW.versionCite({ id: 'zz', label: 'Translation', date: '2026' }, undefined), 'Translation (2026). ' + N + ' research bench, ' + url);
  eq('a text with the record\'s fields in it', SW.versionCite(v, 'Kuki Shūzō, *The Problem of Contingency*, trans. {authors} ({date}). {url}'), 'Kuki Shūzō, *The Problem of Contingency*, trans. D. M. Berry (2026). ' + url);
  eq('a function of the version', SW.versionCite(v, function (x, o) { return x.id === 'zz' ? o.label + ', ' + o.url : null; }), 'Translation, ' + url);
  eq('a function that gives nothing keeps the kit\'s line', SW.versionCite(v, function () { return ''; }), SW.versionCite(v, undefined));
  eq('a function that fails keeps the kit\'s line', SW.versionCite(v, function () { throw new Error('x'); }), SW.versionCite(v, undefined));
})();
