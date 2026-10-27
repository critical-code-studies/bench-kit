/*
 * tests/run.js - runs the kit's tests in a bench's tests page (tests/annotations.html), after the
 * bench's values (window.BENCH_TESTS, in its tests/annotations.test.js). It reads the bench's
 * index.html and loads its scripts in their order, all but kit/shell.js (which starts the bench),
 * so the tests see the bench as its page does; then the kit modules the tests need that the page
 * has not, then each test file. It waits for the checks that fetch, and reports on the page and
 * as window.__results { passed, failed, failures }. A bench's tests page is only:
 *   <script src="annotations.test.js"></script>
 *   <script src="../kit/tests/run.js"></script>
 * A test file registers its checks through window.T:
 *   T.group(name)      the heading for the checks after it
 *   T.eq(name, got, want), T.yes(name, cond)
 *   T.later(name, fn)  fn() returns a promise; a rejection fails it, with the message
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var here = document.currentScript.src.replace(/[^/]*$/, ''), kit = here.replace(/tests\/$/, '');
  var results = [], pending = [], group = '';
  // the page: a heading, the summary and the list (a bench's page may have its own)
  if (!document.getElementById('sum')) {
    var css = document.createElement('style');
    css.textContent = ':root { --bg: #0a0e15; --text: #dde8f3; --dim: #8ea3b8; --ok: #7be3a0; --bad: #ff8a8a; }' +
      '@media (prefers-color-scheme: light) { :root { --bg: #f7f4ec; --text: #1d2430; --dim: #5d6a78; --ok: #1f7a45; --bad: #b3261e; } }' +
      'body { background: var(--bg); color: var(--text); font: 14px/1.5 system-ui, sans-serif; margin: 0; padding: 16px; } h1 { font-size: 18px; margin: 0 0 4px; }' +
      'p { color: var(--dim); margin: 0 0 12px; max-width: 70ch; } #sum { font-weight: 600; margin: 8px 0 12px; } .ok { color: var(--ok); } .bad { color: var(--bad); }' +
      'ol { padding-left: 1.4em; margin: 0; } li { margin: 2px 0; } pre { white-space: pre-wrap; font: 12px ui-monospace, monospace; color: var(--dim); margin: 2px 0 6px; }';
    document.head.appendChild(css);
    document.body.insertAdjacentHTML('afterbegin', '<h1>Tests</h1><p>bench-kit\'s checks of the bench\'s pure parts: the annotation system (Markdown, rich text, plain text for print, earlier wordings, bench links, ghosts, open and resolved, mentions), the version list and the bench\'s own versions, builds, the Help menu and more. Nothing here reads or writes Hypothesis. Open this page from the bench\'s server, not as a file.</p><div id="sum">Running…</div><ol id="out"></ol>');
  }
  var T = window.T = {
    group: function (name) { group = name; },
    eq: function (name, got, want) {
      var ok = JSON.stringify(got) === JSON.stringify(want);
      results.push({ name: (group ? group + ': ' : '') + name, ok: ok, got: got, want: want });
    },
    yes: function (name, cond) { T.eq(name, !!cond, true); },
    later: function (name, fn) {
      var g = group;
      pending.push(Promise.resolve().then(fn).then(null, function (e) {
        results.push({ name: (g ? g + ': ' : '') + name, ok: false, got: String(e && e.message || e), want: 'no error' });
      }));
    }
  };
  function load(src) {
    return new Promise(function (res, rej) {
      var el = document.createElement('script');
      el.src = src + '?t=' + Date.now();
      el.onload = res; el.onerror = function () { rej(new Error('could not load ' + src)); };
      document.body.appendChild(el);
    });
  }
  // the kit modules the tests read, where the page has not loaded them
  var need = [['figures.js', function () { return window.SW.beam; }], ['menus.js', function () { return window.SW.helpList; }],
              ['read.js', function () { return window.SW.symbolRefs; }], ['lispdefs.js', function () { return window.SWLispDefs; }],
              ['book.js', function () { return window.SW.book; }], ['project.js', function () { return window.SW.project; }], ['projectfile.js', function () { return window.SW.projectFile; }], ['mending.js', function () { return window.SW.mending; }]];
  // the bench's scripts, as its index.html loads them (unless the page has loaded them itself)
  var loadErrors = [], loading = '';
  window.addEventListener('error', function (e) { if (loading) loadErrors.push(loading + ': ' + e.message); });
  var chain = window.SWVersions ? Promise.resolve() : fetch(new URL('../index.html', location.href), { cache: 'no-cache' }).then(function (r) { return r.text(); }).then(function (html) {
    var idx = new URL('../index.html', location.href);
    var srcs = Array.prototype.map.call(new DOMParser().parseFromString(html, 'text/html').querySelectorAll('script[src]'), function (el) { return el.getAttribute('src').split('?')[0]; })
      .filter(function (src) { return !/^(https?:)?\/\//.test(src) && !/(^|\/)kit\/shell\.js$/.test(src); });
    return srcs.reduce(function (p, src) { return p.then(function () { loading = src; return load(new URL(src, idx).href); }); }, Promise.resolve())
      .then(function () { loading = ''; if (window.SW && SW.BENCH && SW.BENCH.title) document.title = 'Tests · ' + SW.BENCH.title; });
  });
  need.forEach(function (n) { chain = chain.then(function () { if (!n[1]()) return load(kit + n[0]); }); });
  ['annotations.test.js', 'kit.test.js', 'lispdefs.test.js', 'book.test.js', 'project.test.js', 'versions.test.js', 'projectfile.test.js', 'types.test.js', 'mending.test.js'].forEach(function (f) { chain = chain.then(function () { return load(here + f); }); });
  chain.then(function () { return Promise.all(pending); }).then(function () {
    loadErrors.forEach(function (m) { results.push({ name: 'loading the bench: ' + m.split(':')[0], ok: false, got: m, want: 'no error' }); });
    report();
  }, function (e) {
    results.push({ name: 'loading the tests', ok: false, got: String(e.message || e), want: 'loaded' }); report();
  });
  function report() {
    var SW = window.SW, bad = results.filter(function (r) { return !r.ok; });
    document.getElementById('sum').innerHTML = bad.length ? '<span class="bad">' + bad.length + ' of ' + results.length + ' failed</span>' : '<span class="ok">All ' + results.length + ' passed</span>';
    document.getElementById('out').innerHTML = results.map(function (r) {
      return '<li class="' + (r.ok ? 'ok' : 'bad') + '">' + (r.ok ? '✓ ' : '✗ ') + SW.esc(r.name) +
        (r.ok ? '' : '<pre>got:  ' + SW.esc(JSON.stringify(r.got)) + '\nwant: ' + SW.esc(JSON.stringify(r.want)) + '</pre>') + '</li>';
    }).join('');
    window.__results = { passed: results.length - bad.length, failed: bad.length, failures: bad };
  }
})();
