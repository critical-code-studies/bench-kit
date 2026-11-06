/*
 * tests/images.test.js - checks of kit/images.js's figure box, run by tests/run.js, whatever the bench:
 * the module loaded here with one figure given in its settings, the box opened, ✕ and the export
 * buttons clicked, downloads counted.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, here = document.currentScript.src.replace(/[^/]*$/, ''), kit = here.replace(/tests\/$/, '');
  var PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function box() { var ds = document.querySelectorAll('dialog.im-figdlg'); return ds[ds.length - 1] || null; }
  T.later('the figure box', function () {
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
  });
})();
