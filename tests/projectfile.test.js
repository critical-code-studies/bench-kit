/*
 * tests/projectfile.test.js - checks of kit/projectfile.js's pure parts, run by tests/run.js: the
 * list of CCS-WB samples read from its Samples.md, the id a session is given, and the role of a
 * session's file.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, eq = T.eq, P = window.SW.projectFile;
  T.group('Project files: CCS-WB sessions');
  var md = '# Samples\n\n```\n- folder/filename.ccs: Display Name | mode | Description | era | annotation_count\n```\n\n' +
    '- eliza/eliza-1965b-CR.ccs: 1965 - ELIZA (Annotated) | critique | Complete critique session | 1960s | 30\n' +
    '- iplv-1958/iplv-1958.ccs: 1958 - IPL-V | critique | List processing | 1950s | 0\n';
  eq('the samples listed, the format\'s example left out', P.parseSamples(md), [
    { path: 'eliza/eliza-1965b-CR.ccs', name: '1965 - ELIZA (Annotated)', mode: 'critique', about: 'Complete critique session', era: '1960s', annotations: 30 },
    { path: 'iplv-1958/iplv-1958.ccs', name: '1958 - IPL-V', mode: 'critique', about: 'List processing', era: '1950s', annotations: 0 }]);
  eq('a session\'s id, or its name where the id is generated', [P.idOf({ id: '10print-2013-archaeology' }), P.idOf({ id: '5f9ad354-5736-4bfc-8521-3794dd87c509', name: 'ELIZA, annotated' }), P.idOf({ projectName: 'My Project' })],
     ['10print-2013-archaeology', 'eliza-annotated', 'my-project']);
  eq('a README or markdown file read as documentation, the rest as program', ['README.md', 'notes.md', 'DOCTOR.txt', 'ELIZA-1965b.mad'].map(function (n) { return P.roleOf({ name: n }); }), ['doc', 'doc', 'program', 'program']);
})();
