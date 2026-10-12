/*
 * tests/run.js - runs the kit's tests in a bench's tests page, after the bench's scripts and its
 * values (window.BENCH_TESTS, in its tests/annotations.test.js). It loads the kit modules the
 * tests need that the page has not, then each test file, waits for those that fetch, and
 * reports in #sum and #out and as window.__results { passed, failed, failures }.
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
              ['read.js', function () { return window.SW.symbolRefs; }]];
  var chain = Promise.resolve();
  need.forEach(function (n) { chain = chain.then(function () { if (!n[1]()) return load(kit + n[0]); }); });
  ['annotations.test.js', 'kit.test.js'].forEach(function (f) { chain = chain.then(function () { return load(here + f); }); });
  chain.then(function () { return Promise.all(pending); }).then(report, function (e) {
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
