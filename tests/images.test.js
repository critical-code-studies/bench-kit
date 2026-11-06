/*
 * tests/images.test.js - checks of kit/images.js, run by tests/run.js, whatever the bench: the module
 * loaded here with its settings given. The figure box opened, ✕ and the export buttons clicked,
 * downloads counted; a bench's own copies, with nothing asked of the library; the queue of requests to a
 * library's service.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, here = document.currentScript.src.replace(/[^/]*$/, ''), kit = here.replace(/tests\/$/, '');
  var PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function box() { var ds = document.querySelectorAll('dialog.im-figdlg'); return ds[ds.length - 1] || null; }
  T.group('Images');
  function figureBox() {
    var SW = window.SW, B = SW.BENCH, was = { images: B.images, mod: SW.images, view: SW.views && SW.views.images, kit: SW.kitViews };
    SW.views = SW.views || {};
    B.images = { figures: { items: [{ id: 'fig-01', n: 1, file: PIXEL, original: PIXEL, overlays: true, caption: 'One.' }], labels: { [PIXEL.split('/').pop()]: [{ jp: '甲', en: 'first', x: 0.5, y: 0.5 }] } } };
    var saved = [], click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.download) saved.push(this.download); };
    function restore() {
      HTMLAnchorElement.prototype.click = click;
      B.images = was.images; SW.images = was.mod; SW.kitViews = was.kit;
      if (was.view) SW.views.images = was.view; else delete SW.views.images;
      var sec = document.getElementById('view-images'); if (sec && !was.view) sec.remove();
      document.querySelectorAll('dialog.im-figdlg, dialog.im-pagedlg').forEach(function (d) { if (d.open) d.close(); d.remove(); });
    }
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = kit + 'images.js?t=' + Date.now(); s.onload = res; s.onerror = function () { rej(new Error('could not load images.js')); }; document.body.appendChild(s);
    }).then(function () { return SW.images.openFigure('fig-01'); }).then(function () { return wait(50); }).then(function () {
      T.group('Images: the figure box');
      var d = box();
      T.yes('a figure opens in its box', d && d.open);
      d.querySelector('.tray-bighead [title^="Close"]').click();
      return wait(150).then(function () { T.eq('closing the box starts no download', saved, []); T.eq('✕ closes it', !!(d.open), false); });
    }).then(function () { return SW.images.openFigure('fig-01'); }).then(function () { return wait(50); }).then(function () {
      var d = box();
      d.querySelector('[data-exp="png"]').click();
      return wait(400).then(function () {
        T.eq('PNG saves one file', saved.length, 1);
        T.eq('and leaves the box open', !!d.open, true);
        d.querySelector('[data-exp="svg"]').click();
        return wait(400).then(function () {
          T.eq('SVG saves one file', saved.length, 2);
          T.eq('as an .svg', /\.svg$/.test(saved[1] || ''), true);
          T.eq('and leaves the box open', !!d.open, true);
        });
      });
    }).then(restore, function (e) { restore(); throw e; });
  }
  // the bench's own copies: nothing asked of the library
  function heldCopies() {
    var SW = window.SW, B = SW.BENCH, was = { images: B.images, mod: SW.images, view: SW.views && SW.views.images, kit: SW.kitViews, map: window.SWImagesHeld };
    SW.views = SW.views || {};
    window.SWImagesHeld = { images: { 45: { service: 'https://library.example/iiif/R45', v: 2, w: 100, h: 50 } } };
    B.images = { map: 'SWImagesHeld', start: 'pages', held: { thumb: PIXEL + '#{key3}', full: PIXEL + '#full-{key}' } };
    var asked = [], fetch0 = window.fetch;
    window.fetch = function (u) { asked.push(String(u)); return fetch0.apply(window, arguments); };
    var sec = document.createElement('section'); sec.id = 'view-images'; sec.className = 'view'; document.body.appendChild(sec);
    function restore() {
      window.fetch = fetch0; B.images = was.images; SW.images = was.mod; SW.kitViews = was.kit; window.SWImagesHeld = was.map;
      if (was.view) SW.views.images = was.view; else delete SW.views.images;
      sec.remove();
      document.querySelectorAll('dialog.im-pagedlg').forEach(function (d) { if (d.open) d.close(); d.remove(); });
    }
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = kit + 'images.js?t=' + Date.now(); s.onload = res; s.onerror = function () { rej(new Error('could not load images.js')); }; document.body.appendChild(s);
    }).then(function () {
      T.group('Images: held copies');
      SW.views.images.show();
      var card = sec.querySelector('.im-card img');
      T.eq('a thumbnail from the bench’s file, {key3} filled', card && card.getAttribute('src'), PIXEL + '#045');
      SW.images.openPage('45', '10,10,20,20');
      return wait(250);
    }).then(function () {
      var d = document.querySelector('dialog.im-pagedlg'), base = d.querySelector('.im-base'), roi = d.querySelector('.im-roi');
      T.eq('the zooming box on the bench’s full-size file', base.getAttribute('src'), PIXEL + '#full-45');
      T.eq('the region drawn on it', !roi.hidden, true);
      T.eq('nothing asked of the library', asked.filter(function (u) { return /library\.example/.test(u); }), []);
      T.eq('and no tile', d.querySelectorAll('.im-tiles img').length, 0);
      T.yes('a plain link to the library’s copy stays', d.querySelector('a[href^="https://library.example/iiif/R45"]'));
    }).then(restore, function (e) { restore(); throw e; });
  }
  // the queue that keeps a library's service answering
  function imageQueue() {
    return new Promise(function (res, rej) {
      if (window.SW.images && window.SW.images.makeQueue) return res();
      var s = document.createElement('script'); s.src = kit + 'images.js?t=' + Date.now(); s.onload = res; s.onerror = function () { rej(new Error('could not load images.js')); }; document.body.appendChild(s);
    }).then(function () {
      var make = window.SW.images.makeQueue, running = 0, most = 0;
      var q = make({ max: 2, wait: 5 });
      var done = [];
      function task(id) { return { start: function (ok) { running++; most = Math.max(most, running); setTimeout(function () { running--; done.push(id); ok(); }, 5); } }; }
      for (var i = 0; i < 6; i++) q.add(task(i));
      var gaveUp = 0, tries = 0, q2 = make({ max: 2, wait: 20, tries: 3 });
      q2.add({ start: function (ok, err) { tries++; err(); }, fail: function () { gaveUp++; } });
      var ran = 0, q3 = make({ max: 1, wait: 80, tries: 3 }), t0 = Date.now(), second = 0, attempts = 0;
      q3.add({ start: function (ok, err) { attempts++; if (attempts === 1) err(); else { second = Date.now() - t0; ok(); } } });
      var q4 = make({ max: 2 }); q4.add({ live: function () { return false; }, start: function (ok) { ran++; ok(); } });
      return wait(700).then(function () {
        T.group('Images: asking a library’s service');
        T.eq('all asked for in the end', done.length, 6);
        T.eq('never more than the limit at once', most, 2);
        T.eq('a failure asked again, then given up', [tries, gaveUp], [3, 1]);
        T.yes('a failure waits before asking again', second >= 70);
        T.eq('an image no longer on the page is not asked for', ran, 0);
      });
    });
  }
  // one after another: each loads the module with settings of its own
  T.later('the Images tab', function () { return (T.fetchChain = figureBox().then(heldCopies).then(imageQueue)); });
})();
