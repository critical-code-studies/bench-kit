/*
 * tests/about.test.js - checks of the About box's citation (kit/about.js), run by tests/run.js: the
 * bench's address where it gives no DOI, the DOI where it does.
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
})();
