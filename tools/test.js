#!/usr/bin/env node
/*
 * tools/test.js - runs a bench's test pages (tests/*.html) in headless Chrome and reports, for a
 * person or for GitHub Actions: each page's count, and every failure with what it got and
 * wanted. It exits 1 when a test fails or a page does not finish. Run from the bench's repository:
 *
 *   node research/kit/tools/test.js                          every page in research/tests/
 *   node research/kit/tools/test.js tests/annotations.html   one page
 *   --dir <folder>   the bench's folder (research by default, or . where index.html is)
 *
 * A test page reports through window.__results { passed, failed, failures } (the kit's
 * tests/run.js does). Needs Google Chrome or Chromium and Node 22; no packages.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('./chrome.js');

const argv = process.argv.slice(2);
const dir = C.benchDir(argv, 'test');
const named = argv.filter((a, i) => /\.html$/.test(a) && argv[i - 1] !== '--dir');
const pages = named.length ? named : fs.readdirSync(path.join(dir, 'tests')).filter((f) => f.endsWith('.html')).sort().map((f) => 'tests/' + f);
if (!pages.length) C.fail('test', 'no test pages in ' + path.join(dir, 'tests'));

(async () => {
  let failed = 0;
  for (const url of pages) {
    try {
      const r = await C.withBench({ dir, url, ready: 'window.__results', wait: 360 }, (page) => page.evaluate('JSON.stringify(window.__results)').then(JSON.parse));
      console.log(url + ': ' + r.passed + ' passed' + (r.failed ? ', ' + r.failed + ' failed' : ''));
      (r.failures || []).forEach((f) => {
        console.log('  ✗ ' + (typeof f === 'string' ? f : f.name + '\n      got:  ' + JSON.stringify(f.got) + '\n      want: ' + JSON.stringify(f.want)));
      });
      failed += r.failed || 0;
    } catch (e) { console.log(url + ': did not finish (' + e.message + ')'); failed++; }
  }
  process.exitCode = failed ? 1 : 0;
})();
