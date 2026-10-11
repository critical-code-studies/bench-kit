/* config.js - this bench's settings for bench-kit. Load it after core.js and before the kit. */
(function (root) {
  'use strict';
  root.SW.BENCH = {
    name: 'Example',
    title: 'Example Research Bench',
    relation: 'Example ',
    topShare: false,
    paratexts: { org: 'critical-code-studies', repo: 'example_paratexts', cache: 'example-paratexts' },
    examples: { date: 'e.g. 1970-05-17, or 1970', archive: 'e.g. Computer History Museum', versions: 'e.g. v1, v2',
                refs: 'e.g. [REF: …]', publisher: 'e.g. MIT Press', finding: 'F1' }
  };
})(typeof window !== 'undefined' ? window : globalThis);
