/*
 * images.js - the Images tab: the bench's scanned images, apart from Graphics (pictures a bench draws
 * with code). Off unless the bench sets SW.BENCH.images; loaded after kit/book.js, before kit/shell.js.
 *   Pages    every image of the bench's image map (kit/tools/iiif-map.js: root.SWImages, or the global
 *            images.map names), as thumbnails; one opens in a box that zooms through the library's
 *            IIIF tiles (its info.json: quick sizes while the whole image shows, tiles as it is
 *            enlarged), or the bench's own copy where the service gives none
 *   Figures  the author's figures (images.figures), each in a box: the print file or the archival
 *            original; the English labels drawn over it from data, or the source alone; where a figure
 *            has no labels, the key from its caption beside it; On the page (its region of the page
 *            image, outlined, in the zooming box); the page in Book; and a labelled copy exported as PNG
 *            or SVG (made then, never stored), its labels gold or black. The labels are in kintsugi
 *            gold, as what the bench adds to the author's figure: one gold for every theme (#7a5c00,
 *            6.25:1 on white), since a figure's ground stays white whatever the bench's colours.
 *   Figures come first where the bench has them; images.start: 'pages' for Pages first.
 *   Collections  further sets of images (images.collections: [{ url } or the object itself]), each one more
 *            part beside Pages and Figures, with its count. { id, label, intro, credit, items: [{ key, n,
 *            page, what, thumb, file, zoom, record }] }: thumb for the grid; file the bench's own copy,
 *            what the box shows; zoom a larger copy on another site or null, asked for with an <img> only
 *            when the reader zooms past the bench's copy, and if it fails the bench's copy stays, with a
 *            small note; record the holder's page; page a page of the book. intro and credit are plain
 *            text, and credit shows on the set and in the box. Links: ?tab=images&set=<id>&img=<key>.
 * Where the rights allow, a bench holds its own copies (images.held: { thumb, full }, paths with {key} or
 * {key3}: 'img/full/{key3}.webp'): the thumbnails and the zooming box then come from its files and no
 * request goes to the library, the box zooming on the one full-size file; a region is still in its pixels.
 * Otherwise a library's service is asked through a queue (I.makeQueue): a few requests at a time, backing
 * off and asking again on a failure (a 429), what is on the screen kept, no broken image left.
 * A translation bench makes both files with kit/tools/vt-figures.js.
 * SW.BENCH.images: true, or { label, map, held, figures: { url, overlays } (or { items, labels }, given here), intro, credit, labelsNote, start }:
 *   labelsNote, HTML folded under a figure's key ("About the labels"), with a figure's own labelsNote
 *   before it: why some of the source's writing has no label of its own (a word written a character
 *   at a time along a line has one label). figures.url gives
 *   { items: [{ id, n, file, original, page, image, region, overlays, caption, key }] }: image is the
 *   page image's key in the map, region IIIF's x,y,w,h in that image's full-size pixels, overlays false
 *   where the figure is shown without labels (whatever the labels file holds); figures.overlays gives
 *   { "<the print file's name>": [{ jp, en, x, y, align, anchor, angle }] }, x and y fractions of the
 *   print file's width and height: the label's top at y and its left edge at x (align left) or its right
 *   edge (align right), as kit-built books set them (vector-book's vfig); with anchor 'center', its
 *   centre at x, y; angle, degrees clockwise about that point. docs/figure-labels.md gives the rules
 *   for placing them.
 * Links: ?tab=images&img=<key> and ?tab=images&fig=<id>. SW.images: openPage(key, region), openFigure(id),
 * figures(), collections(), openItem(set, key), zoom(el, x, o) (the zooming box's engine, for other views).
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW, B = SW.BENCH || {};
  var C = B.images === true ? {} : B.images || null;
  var I = SW.images = {};
  // A library's image service answers too many requests at once with 429. Its images are asked for
  // through one queue: a few at a time, what the reader has just asked for first. A failure stops the
  // queue for a while, longer each time, and the request is made again; after o.tries it is given up
  // (t.fail). A request whose image has left the page is dropped. A task: { start(ok, err), live(), fail(), low }.
  I.makeQueue = function (o) {
    o = o || {};
    var max = o.max || 4, tries = o.tries || 4, wait0 = o.wait || 1500, waitMax = o.waitMax || 30000;
    var q = [], running = 0, until = 0, strikes = 0, timer = null;
    function pump() {
      clearTimeout(timer); timer = null;
      var now = Date.now();
      if (now < until) { if (q.length) timer = setTimeout(pump, until - now); return; }
      while (running < max && q.length && Date.now() >= until) {
        var t = q.shift();
        if (!t.live || t.live()) run(t);
      }
      if (q.length && !timer && Date.now() < until) timer = setTimeout(pump, until - Date.now());
    }
    function run(t) {
      var settled = false;
      running++;
      t.start(function () {
        if (settled) return; settled = true; running--; strikes = 0; pump();
      }, function () {
        if (settled) return; settled = true; running--; strikes++; t.n = (t.n || 0) + 1;
        until = Date.now() + Math.min(waitMax, wait0 * Math.pow(2, strikes - 1));
        if (t.n >= tries) { if (t.fail) t.fail(); } else q.unshift(t);
        pump();
      });
    }
    return { add: function (t) { if (t.low) q.push(t); else q.unshift(t); pump(); }, size: function () { return q.length + running; } };
  };
  var Q = I.queue = I.makeQueue();
  // an image's file asked for through the queue; on failure it has no src, so no broken-image mark
  function loadInto(img, url, o) {
    o = o || {};
    Q.add({ low: o.low, fail: o.fail, live: function () { return img.isConnected && (!o.live || o.live()); }, start: function (ok, err) {
      img.onload = function () { img.onload = img.onerror = null; ok(); };
      img.onerror = function () { img.onload = img.onerror = null; img.removeAttribute('src'); if (o.again) o.again(); err(); };
      img.src = url;
    } });
  }
  if (!C || (SW.menuOff && SW.menuOff('images')) || !SW.views) return;
  var esc = SW.esc, FG = C.figures || B.figures || null;
  var Q0 = SW.readQuery ? SW.readQuery() : {};
  function map() { var m = root[C.map || 'SWImages']; return m && m.images ? m : { images: {} }; }
  // the bench's own copy of an image (images.held), or null: { thumb, full }, from {key} and {key3} (the key
  // in three figures), or a function (key, entry)
  function heldOf(key, x) {
    var h = C.held; if (!h) return null;
    if (typeof h === 'function') return h(key, x) || null;
    var k3 = String(key).padStart(3, '0'), f = function (t) { return t ? String(t).split('{key3}').join(k3).split('{key}').join(key) : null; };
    return { thumb: f(h.thumb), full: f(h.full) };
  }

  // ---------- the tab ----------
  var tabs = SW.$('#tabs');
  if (tabs && !SW.$('[data-tab="images"]', tabs)) {
    var btn = SW.el('button', { 'data-tab': 'images', title: 'The scanned images: the pages, and the figures with their labels' }, esc(C.label || 'Images'));
    var after = SW.$('[data-tab="book"]', tabs);
    tabs.insertBefore(btn, after ? after.nextSibling : SW.$('[data-menu="versions"], [data-menu="help"]', tabs));
  }
  var main = SW.$('section.view') && SW.$('section.view').parentNode;   // beside the bench's own views, whichever it has
  if (main && !SW.$('#view-images')) main.appendChild(SW.el('section', { class: 'view', id: 'view-images' }));
  SW.kitViews = (SW.kitViews || []).concat('images');

  // ---------- the figures' data ----------
  var figs = null;
  I.figures = function () {
    if (figs) return figs;
    if (FG && FG.items) { FG.items.forEach(function (f) { f.labels = f.overlays === false ? [] : (FG.labels || {})[String(f.file).split('/').pop()] || []; }); return (figs = Promise.resolve(FG.items)); }
    if (!FG || !FG.url) return (figs = Promise.resolve([]));
    var get = function (u) { return fetch(u, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(u + ': ' + r.status); return r.json(); }); };
    figs = Promise.all([get(FG.url), FG.overlays ? get(FG.overlays).catch(function () { return {}; }) : {}]).then(function (r) {
      var items = (Array.isArray(r[0]) ? r[0] : r[0].items || []).filter(function (f) { return f && f.id && f.file; }), ov = r[1] || {};
      items.forEach(function (f) { f.labels = f.overlays === false ? [] : ov[String(f.file).split('/').pop()] || []; });
      return items;
    });
    figs.catch(function () { figs = null; });
    return figs;
  };

  // ---------- the view ----------
  // the part shown first: Figures where the bench has them (images.start: 'pages' for Pages), Pages for a link to one
  var part = Q0.set ? 'set:' + Q0.set : Q0.img ? 'pages' : Q0.fig || (FG && C.start !== 'pages') ? 'figures' : 'pages', drawn = false;
  // ---------- further collections of images ----------
  var setsP = null;
  I.collections = function () {
    return setsP || (setsP = Promise.all((C.collections || []).map(function (c) {
      if (!c.url) return Promise.resolve(c);
      return fetch(c.url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) { return Object.assign({}, j, c); }).catch(function (e) { return { id: c.id || c.url, label: c.label || c.url, items: [], err: 'could not be read (' + e.message + ')' }; });
    })).then(function (ss) { return ss.filter(function (s) { return s && s.id; }); }));
  };
  function setOf(ss, id) { return ss.filter(function (s) { return s.id === id; })[0] || null; }
  function draw() {
    var view = SW.$('#view-images'); if (!view) return;
    var keys = Object.keys(map().images);
    view.innerHTML = '<div class="im"><div class="toolbar im-bar"><span class="im-parts">' +
      '<button class="btn' + (part === 'pages' ? ' on' : '') + '" data-part="pages">Pages <span class="faint">' + keys.length + '</span></button>' +
      (FG ? '<button class="btn' + (part === 'figures' ? ' on' : '') + '" data-part="figures">Figures <span class="faint im-nf"></span></button>' : '') +
      '</span>' + (C.credit || map().credit ? '<span class="faint im-credit">' + (C.credit || esc(map().credit)) + '</span>' : '') + '</div>' +
      (C.intro ? '<div class="im-intro">' + C.intro + '</div>' : '') + '<div class="im-setintro" hidden></div><div class="im-body"></div></div>';
    if (FG) I.figures().then(function (fs) { var n = SW.$('.im-nf', view); if (n) n.textContent = fs.length; });
    I.collections().then(function (ss) {
      var parts = SW.$('.im-parts', view); if (!parts) return;
      ss.forEach(function (s) {
        var key = 'set:' + s.id;
        parts.appendChild(SW.el('button', { class: 'btn' + (part === key ? ' on' : ''), 'data-part': key }, esc(s.label || s.id) + ' <span class="faint">' + (s.items || []).length + '</span>'));
      });
      if (/^set:/.test(part) && !setOf(ss, part.slice(4))) { part = FG && C.start !== 'pages' ? 'figures' : 'pages'; SW.$$('[data-part]', view).forEach(function (b) { b.classList.toggle('on', b.dataset.part === part); }); body(view); }
    });
    body(view);
    view.addEventListener('click', function (e) {
      var p = e.target.closest('[data-part]'); if (p) { part = p.dataset.part; SW.$$('[data-part]', view).forEach(function (b) { b.classList.toggle('on', b === p); }); body(view); return; }
      var it = e.target.closest('[data-set]'); if (it) { I.openItem(it.dataset.set, it.dataset.key); return; }
      var k = e.target.closest('[data-img]'); if (k) { I.openPage(k.dataset.img); return; }
      var f = e.target.closest('[data-fig]'); if (f) I.openFigure(f.dataset.fig);
    });
    if (Q0.set && Q0.img) { var s0 = Q0.set, i0 = Q0.img; Q0.img = null; I.openItem(s0, i0); }
    if (Q0.img) { var k0 = Q0.img; Q0.img = null; I.openPage(k0); }
    if (Q0.fig) { var f0 = Q0.fig; Q0.fig = null; I.openFigure(f0); }
  }
  function body(view) {
    var box = SW.$('.im-body', view), cr = SW.$('.im-bar .im-credit', view), si = SW.$('.im-setintro', view), general = SW.$('.im-intro', view);
    var isSet = /^set:/.test(part);
    if (si) si.hidden = !isSet;
    if (general) general.hidden = isSet;
    if (cr) cr.hidden = isSet;
    if (isSet) {
      box.innerHTML = '<p class="hint pad">Reading the collection…</p>';
      I.collections().then(function (ss) {
        var s = setOf(ss, part.slice(4)); if (!s) return;
        if (s.err) { box.innerHTML = '<p class="pad badge err">' + esc(s.label || s.id) + ' ' + esc(s.err) + '.</p>'; return; }
        si.innerHTML = (s.intro ? '<div class="im-intro">' + esc(s.intro) + '</div>' : '') + (s.credit ? '<p class="hint im-setcredit">' + esc(s.credit) + '</p>' : '');
        box.innerHTML = (s.items || []).length ? '<div class="im-grid">' + s.items.map(function (x) {
          return '<button class="im-card" data-set="' + esc(s.id) + '" data-key="' + esc(x.key) + '"><img loading="lazy" src="' + esc(x.thumb || x.file) + '" alt=""><span><b>' + esc(x.n != null ? x.n : x.key) + '</b>' + (x.page != null ? ' · p. ' + esc(x.page) : '') + (x.what ? ' · ' + esc(x.what) : '') + '</span></button>';
        }).join('') + '</div>' : '<p class="hint pad">Nothing in this collection.</p>';
        box.addEventListener('error', function (e) { var c = e.target.closest && e.target.closest('.im-card'); if (c) c.classList.add('im-fail'); }, true);
      });
      return;
    }
    if (part === 'pages') {
      var m = map(), keys = Object.keys(m.images);
      box.innerHTML = keys.length ? '<div class="im-grid">' + keys.map(function (k) {
        var x = m.images[k], h = heldOf(k, x), u = h ? (h.thumb || h.full) : x.service ? SW.iiifImage(x, { width: 160 }).src : '';
        return '<button class="im-card" data-img="' + esc(k) + '"><img ' + (h ? 'loading="lazy" src' : 'data-src') + '="' + esc(u) + '" alt=""><span>' + esc(k) + (x.label && x.label !== k ? ' · ' + esc(x.label) : '') + '</span></button>';
      }).join('') + '</div>' : '<p class="hint pad">The bench has no image map yet (kit/tools/iiif-map.js).</p>';
      thumbs(box);
      return;
    }
    box.innerHTML = '<p class="hint pad">Reading the figures…</p>';
    I.figures().then(function (fs) {
      box.innerHTML = fs.length ? '<div class="im-grid im-figs">' + fs.map(function (f) {
        return '<button class="im-card" data-fig="' + esc(f.id) + '"><img loading="lazy" src="' + esc(f.file) + '" alt=""><span><b>Figure ' + esc(f.n != null ? f.n : f.id) + '</b>' + (f.page != null ? ' · p. ' + esc(f.page) : '') + '</span></button>';
      }).join('') + '</div>' : '<p class="hint pad">No figures.</p>';
    }, function (e) { box.innerHTML = '<p class="pad badge err">' + esc(e.message) + '</p>'; });
  }
  // Pages' thumbnails: the service's asked for through the queue as they come into view; one that cannot
  // be had shows its card without a broken image
  function thumbs(box) {
    // a held file that cannot be read; one through the queue is asked for again first (it has its own onerror)
    box.addEventListener('error', function (e) { if (e.target.onerror) return; var c = e.target.closest && e.target.closest('.im-card'); if (c) c.classList.add('im-fail'); }, true);
    var ask = function (img) {
      var u = img.dataset.src; if (!u) return;
      delete img.dataset.src;
      loadInto(img, u, { low: true, fail: function () { var c = img.closest('.im-card'); if (c) c.classList.add('im-fail'); } });
    };
    var imgs = SW.$$('img[data-src]', box);
    if (!root.IntersectionObserver) { imgs.forEach(ask); return; }
    var io = new root.IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); ask(e.target); } }); }, { rootMargin: '200px' });
    imgs.forEach(function (img) { io.observe(img); });
  }
  SW.views.images = { show: function () { if (!drawn) { drawn = true; draw(); } } };

  // ---------- a box over the bench ----------
  function dialog(head, cls) {
    var d = SW.el('dialog', { class: 'tray-big im-dlg ' + (cls || '') });
    d.innerHTML = '<div class="tray-bighead">' + head + '<button class="icon-btn" data-x title="Close (Esc)">✕</button></div>';
    document.body.appendChild(d);
    d.addEventListener('close', function () { if (d._zoom) d._zoom.stop(); d.remove(); });
    d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-x]')) d.close(); });
    d.showModal();
    return d;
  }

  // ---------- zooming: the bench's own copy, or through a IIIF service's tiles ----------
  // el: the box to draw in; x: an image map's entry ({ service, w, h }) or a service's URL; o.region:
  // x,y,w,h to open at and outline, in the pixels of the full-size image. o.src: the bench's own full-size
  // file (o.thumb shown until it comes), and nothing is asked of any service. Otherwise the whole image
  // first, at a size the service has ready; the tiles of the scale that suits the zoom, those in view only,
  // over it, through the queue. Wheel, pinch, drag, + − and 0.
  I.zoom = function (el, x, o) {
    o = o || {};
    if (typeof x === 'string') x = { service: x };
    var svc = x.service ? String(x.service).replace(/\/$/, '') : null, W = x.w, H = x.h, tiles = null, s = 1, tx = 0, ty = 0, alive = true;
    el.classList.add('im-zoom');
    el.innerHTML = '<div class="im-plane"><img class="im-base" alt=""><div class="im-tiles"></div><div class="im-roi" hidden></div></div>' +
      '<div class="im-zbtns"><button class="btn ghost" data-z="+" title="Zoom in (+)">+</button><button class="btn ghost" data-z="-" title="Zoom out (−)">−</button><button class="btn ghost" data-z="0" title="The whole image (0)">⤢</button></div>';
    var plane = SW.$('.im-plane', el), base = SW.$('.im-base', el), layer = SW.$('.im-tiles', el), roi = SW.$('.im-roi', el), have = {};
    var fitS = 0;
    function fit() { var r = el.getBoundingClientRect(); s = fitS = Math.min(r.width / W, r.height / H); tx = (r.width - W * s) / 2; ty = (r.height - H * s) / 2; }
    function toRegion(g) { var r = el.getBoundingClientRect(); s = Math.min(r.width / g[2], r.height / g[3]) * 0.8; tx = r.width / 2 - (g[0] + g[2] / 2) * s; ty = r.height / 2 - (g[1] + g[3] / 2) * s; }
    function place() {
      plane.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
      base.style.width = W * s + 'px'; base.style.height = H * s + 'px';
      deepen();
      if (o.region) { var g = o.region; roi.hidden = false; roi.style.left = g[0] * s + 'px'; roi.style.top = g[1] * s + 'px'; roi.style.width = g[2] * s + 'px'; roi.style.height = g[3] * s + 'px'; }
      tile();
    }
    // o.deep: a larger copy elsewhere, asked for once the reader has zoomed in past the detail of the file
    // shown, with an <img> only (another site may refuse fetch and canvas). If it fails, the file shown stays,
    // and it is asked for again a minute later if the reader is still zooming.
    var deepAt = 0, deepDone = false;
    function deepen() {
      if (!o.deep || deepDone || !alive || !fitS || s <= fitS * 1.01 || s * (root.devicePixelRatio || 1) <= 1.05 || Date.now() - deepAt < 60000) return;
      deepAt = Date.now();
      var im = new Image();
      im.onload = function () { if (!alive) return; deepDone = true; base.src = o.deep; };
      im.onerror = function () { if (alive) say('The larger copy is not answering: this is the bench’s copy.'); };
      im.src = o.deep;
    }
    // the tiles in view, at the scale that suits the zoom (no finer than the screen needs)
    var timer = null;
    function tile() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (!alive || !tiles) return;
        var dpr = root.devicePixelRatio || 1, want = 1 / (s * dpr), sf = tiles.scaleFactors[0];
        tiles.scaleFactors.forEach(function (f) { if (f <= want) sf = Math.max(sf, f); });
        if (s * dpr * sf > 1.5 && sf === tiles.scaleFactors[0]) { /* already finest */ }
        var ts = tiles.width * sf, r = el.getBoundingClientRect();
        // nothing finer than the image already shown
        if (W * s <= base.naturalWidth * 1.05 && base.complete) { SW.$$('img', layer).forEach(function (t) { t.remove(); }); have = {}; return; }
        var x0 = Math.max(0, Math.floor(-tx / s / ts)), y0 = Math.max(0, Math.floor(-ty / s / ts));
        var x1 = Math.min(Math.ceil(W / ts) - 1, Math.floor((r.width - tx) / s / ts)), y1 = Math.min(Math.ceil(H / ts) - 1, Math.floor((r.height - ty) / s / ts));
        var keep = {};
        for (var j = y0; j <= y1; j++) for (var i = x0; i <= x1; i++) {
          var k = sf + '/' + i + '/' + j; keep[k] = 1;
          var rx = i * ts, ry = j * ts, rw = Math.min(ts, W - rx), rh = Math.min(ts, H - ry), t = have[k];
          if (!t) { t = have[k] = SW.el('img', { alt: '', draggable: 'false' }); layer.appendChild(t); askTile(t, k, svc + '/' + rx + ',' + ry + ',' + rw + ',' + rh + '/' + Math.ceil(rw / sf) + ',/0/default.jpg'); }
          t.style.left = rx * s + 'px'; t.style.top = ry * s + 'px'; t.style.width = rw * s + 'px'; t.style.height = rh * s + 'px';
        }
        Object.keys(have).forEach(function (k) { if (!keep[k]) { have[k].remove(); delete have[k]; } });
      }, 60);
    }
    // a tile that cannot be had leaves the image under it showing, and is asked for again when the view next moves
    function askTile(t, k, url) { loadInto(t, url, { live: function () { return alive && have[k] === t; }, fail: function () { if (have[k] === t) { t.remove(); delete have[k]; } } }); }
    function say(msg) { var m = SW.$('.im-zmsg', el) || el.appendChild(SW.el('p', { class: 'hint im-zmsg' })); m.textContent = msg; }
    function busy() { say('The library’s image service is busy: asking again…'); }
    function zoomAt(f, cx, cy) { var ns = Math.max(0.02, Math.min(4, s * f)); tx = cx - (cx - tx) * ns / s; ty = cy - (cy - ty) * ns / s; s = ns; place(); }
    el.addEventListener('wheel', function (e) { e.preventDefault(); var r = el.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY / 400), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    var drag = null;
    el.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; drag = { x: e.clientX, y: e.clientY, tx: tx, ty: ty }; el.setPointerCapture(e.pointerId); el.classList.add('im-grab'); });
    el.addEventListener('pointermove', function (e) { if (!drag) return; tx = drag.tx + e.clientX - drag.x; ty = drag.ty + e.clientY - drag.y; place(); });
    el.addEventListener('pointerup', function () { drag = null; el.classList.remove('im-grab'); });
    el.addEventListener('click', function (e) {
      var z = e.target.closest('[data-z]'); if (!z) return;
      var r = el.getBoundingClientRect();
      if (z.dataset.z === '0') { fit(); place(); } else zoomAt(z.dataset.z === '+' ? 1.5 : 1 / 1.5, r.width / 2, r.height / 2);
    });
    el.tabIndex = 0;
    el.addEventListener('keydown', function (e) { var r = el.getBoundingClientRect(); if (e.key === '+' || e.key === '=') zoomAt(1.5, r.width / 2, r.height / 2); else if (e.key === '-') zoomAt(1 / 1.5, r.width / 2, r.height / 2); else if (e.key === '0') { fit(); place(); } });
    function layout() { if (o.region) toRegion(o.region); else fit(); place(); }
    function start() {
      layout();
      loadInto(base, svc + '/full/' + Math.min(1200, W) + ',/0/default.jpg', { live: function () { return alive; }, again: busy, fail: function () { say('The library’s image service is not answering at the moment: try again in a minute.'); } });
    }
    base.addEventListener('load', function () { var m = SW.$('.im-zmsg', el); if (m) m.remove(); tile(); });
    var stop = { stop: function () { alive = false; } };
    // the bench's own copy: the thumbnail at once, the full size over it, no service asked
    if (o.src) {
      if (W && H) { if (o.thumb) base.src = o.thumb; layout(); }
      var full = new Image();
      full.onload = function () {
        if (!alive) return;
        // the file's own size: a region is in its pixels, and a manifest's canvas may differ from it a little
        if (W !== full.naturalWidth || H !== full.naturalHeight) { W = full.naturalWidth; H = full.naturalHeight; layout(); }
        base.src = o.src; place();
      };
      full.onerror = function () { say(o.thumb && W && H ? 'The full-size image could not be read: this is the small one.' : 'The image could not be read.'); };
      full.src = o.src;
      return stop;
    }
    if (!svc) { say('The bench holds no copy of this image, and names no service for it.'); return stop; }
    // the service's own account of the image: its size and its tiles; without one, the image map's size and no tiles
    Q.add({
      live: function () { return alive; },
      start: function (ok, err) {
        fetch(svc + '/info.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (info) {
          ok();
          W = info.width || W; H = info.height || H;
          var t = (info.tiles || [])[0]; if (t) tiles = { width: t.width, scaleFactors: (t.scaleFactors || [1]).slice().sort(function (a, b) { return a - b; }) };
          start();
        }, function () { busy(); err(); });
      },
      fail: function () { if (W && H) start(); else say('The library’s image service is not answering at the moment: try again in a minute.'); }
    });
    return stop;
  };

  // ---------- a page image ----------
  I.openPage = function (key, region) {
    var x = map().images[key];
    if (!x) { SW.toast('No image ' + key + ' in the bench’s image map.', 3000); return; }
    var g = region ? String(region).split(',').map(Number) : null;
    var h = heldOf(key, x), lib = x.service ? String(x.service).replace(/\/$/, '') + '/full/' + (x.v === 3 ? 'max' : 'full') + '/0/default.jpg' : null, fullAt = h && h.full ? h.full : lib;
    var d = dialog('<b>Image ' + esc(key) + '</b>' + (x.label && x.label !== key ? ' <span class="faint">' + esc(x.label) + '</span>' : '') +
      '<span class="refhelp-acts">' + (fullAt ? '<a class="btn ghost" href="' + esc(fullAt) + '" target="_blank" rel="noopener">Full size ↗</a>' : '') +
      (h && lib ? '<a class="btn ghost" href="' + esc(lib) + '" target="_blank" rel="noopener noreferrer">The library’s copy ↗</a>' : '') +
      '<button class="btn ghost" data-a="link">🔗 Copy link</button></span>', 'im-pagedlg');
    var z = SW.el('div', { class: 'im-zoombox' }); d.appendChild(z);
    if (map().credit || C.credit) d.appendChild(SW.el('p', { class: 'hint im-credit' }, C.credit || esc(map().credit)));
    d._zoom = I.zoom(z, x, { region: g && g.length === 4 && g.every(function (n) { return !isNaN(n); }) ? g : null, src: h && h.full || null, thumb: h && h.thumb || null });
    d.addEventListener('click', function (e) { if (e.target.closest('[data-a="link"]')) SW.copyText(SW.permalink({ tab: 'images', img: key }), 'the link'); });
  };

  // ---------- an image of a further collection ----------
  I.openItem = function (id, key) {
    return I.collections().then(function (ss) {
      var s = setOf(ss, id), x = s && (s.items || []).filter(function (y) { return y.key === key; })[0];
      if (!x) { SW.toast('No image ' + key + ' in that collection.', 3000); return; }
      var d = dialog('<b>' + esc(s.label || s.id) + ' ' + esc(x.n != null ? x.n : x.key) + '</b>' + (x.what ? ' <span class="faint">' + esc(x.what) + '</span>' : '') +
        '<span class="refhelp-acts">' + (x.page != null && SW.views.book ? '<button class="btn ghost" data-a="book" title="The page in Book">Page ' + esc(x.page) + ' ↗</button>' : '') +
        (x.record ? '<a class="btn ghost" href="' + esc(x.record) + '" target="_blank" rel="noopener noreferrer">The holder’s record ↗</a>' : '') +
        (x.zoom ? '<a class="btn ghost" href="' + esc(x.zoom) + '" target="_blank" rel="noopener noreferrer">Full size ↗</a>' : '') +
        '<button class="btn ghost" data-a="link">🔗 Link</button></span>', 'im-pagedlg im-itemdlg');
      var z = SW.el('div', { class: 'im-zoombox' }); d.appendChild(z);
      if (s.credit) d.appendChild(SW.el('p', { class: 'hint im-credit' }, esc(s.credit)));
      d._zoom = I.zoom(z, {}, { src: x.file, thumb: x.thumb || null, deep: x.zoom || null });
      d.addEventListener('click', function (e) {
        var a = e.target.closest('[data-a]'); if (!a) return;
        if (a.dataset.a === 'link') SW.copyText(SW.permalink({ tab: 'images', set: id, img: key }), 'the link');
        if (a.dataset.a === 'book') { d.close(); toBook(x.page); }
      });
    });
  };

  // ---------- a figure ----------
  var FS = { form: 'print', labels: true, ink: 'gold' };
  // the labels' colours in an export: gold (as on the screen) or black, for print
  var INK = { gold: '#7a5c00', black: '#1a1a1a' };
  I.openFigure = function (id) {
    return I.figures().then(function (fs) {
      var f = fs.filter(function (x) { return x.id === id; })[0];
      if (!f) { SW.toast('No figure ' + id + '.', 3000); return; }
      var hasLabels = f.overlays !== false && f.labels.length > 0;
      var d = dialog('<b>Figure ' + esc(f.n != null ? f.n : f.id) + '</b>' + (f.page != null ? ' <span class="faint">p. ' + esc(f.page) + '</span>' : '') +
        '<span class="refhelp-acts">' +
        (f.original ? '<span class="im-seg"><button class="btn" data-form="print">Print</button><button class="btn" data-form="original">Original</button></span>' : '') +
        (hasLabels ? '<span class="im-seg"><button class="btn" data-lab="0">Source only</button><button class="btn" data-lab="1">With English</button></span>' : '') +
        (f.image != null && map().images[f.image] ? '<button class="btn ghost" data-a="page" title="Its place on the page image, outlined">On the page</button>' : '') +
        (f.page != null && SW.views.book ? '<button class="btn ghost" data-a="book" title="The page in Book">Page ' + esc(f.page) + ' ↗</button>' : '') +
        '<details class="im-exp"><summary class="btn ghost">⤓ Export</summary><div>' +
        (hasLabels ? '<span class="im-seg" title="The colour of the labels in the file"><button class="btn" data-ink="gold">Gold</button><button class="btn" data-ink="black">Black</button></span>' : '') +
        '<button class="btn ghost" data-exp="png">PNG</button><button class="btn ghost" data-exp="svg">SVG</button></div></details>' +
        '<button class="btn ghost" data-a="link">🔗 Copy link</button></span>', 'im-figdlg');
      var wrap = SW.el('div', { class: 'im-figwrap' });
      wrap.innerHTML = '<div class="im-stage"><img class="im-figimg" alt="Figure ' + esc(f.n) + '"><div class="im-labels"' + (B.textLang ? ' lang="en"' : '') + '></div></div>' +
        '<div class="im-figtext">' + (f.caption ? '<p class="im-cap"><b>Figure ' + esc(f.n) + '.</b> ' + esc(f.caption) + '</p>' : '') +
        (f.key ? '<p class="im-key' + (hasLabels ? '' : ' im-key-on') + '">' + esc(f.key) + '</p>' : '') +
        // why not every piece of the source has a label: the bench's note, and the figure's own (HTML)
        (hasLabels && (C.labelsNote || f.labelsNote) ? '<details class="im-about"><summary>About the labels</summary>' + (f.labelsNote ? '<p>' + f.labelsNote + '</p>' : '') + (C.labelsNote ? '<p>' + C.labelsNote + '</p>' : '') + '</details>' : '') + '</div>';
      d.appendChild(wrap);
      var img = SW.$('.im-figimg', wrap), lab = SW.$('.im-labels', wrap);
      lab.innerHTML = f.labels.map(labelHTML).join('');
      function show() {
        img.src = FS.form === 'original' && f.original ? f.original : f.file;
        var on = hasLabels && FS.labels && FS.form !== 'original';
        lab.hidden = !on;
        SW.$$('[data-form]', d).forEach(function (b) { b.classList.toggle('on', b.dataset.form === FS.form); });
        SW.$$('[data-ink]', d).forEach(function (b) { b.classList.toggle('on', b.dataset.ink === FS.ink); });
        SW.$$('[data-lab]', d).forEach(function (b) { b.classList.toggle('on', (b.dataset.lab === '1') === FS.labels); b.disabled = FS.form === 'original'; b.title = FS.form === 'original' ? 'The labels are drawn on the print file' : ''; });
      }
      show();
      d.addEventListener('click', function (e) {
        var b = e.target.closest('[data-form]'); if (b) { FS.form = b.dataset.form; show(); return; }
        var l = e.target.closest('[data-lab]'); if (l) { FS.labels = l.dataset.lab === '1'; show(); return; }
        var a = e.target.closest('[data-a]');
        if (a && a.dataset.a === 'page') { I.openPage(f.image, f.region); return; }
        if (a && a.dataset.a === 'book') { d.close(); toBook(f.page); return; }
        if (a && a.dataset.a === 'link') { SW.copyText(SW.permalink({ tab: 'images', fig: f.id }), 'the link'); return; }
        var ik = e.target.closest('[data-ink]'); if (ik) { FS.ink = ik.dataset.ink; show(); return; }
        var x = e.target.closest('[data-exp]'); if (x) exportFig(f, x.dataset.exp, hasLabels && FS.labels && FS.form !== 'original', FS.ink);
      });
    });
  };
  // A label over a figure. By default its top is at y and its left edge at x (align left) or its right
  // edge (align right); anchor 'center' puts its centre at x, y. angle: degrees, clockwise, about that
  // point (a label set along a diagonal, or running down beside the drawing).
  function labelHTML(l) {
    var right = l.align === 'right', mid = l.anchor === 'center', a = +l.angle || 0;
    var pos = 'top:' + (100 * l.y) + '%;' + (mid || !right ? 'left:' + (100 * l.x) + '%' : 'right:' + (100 - 100 * l.x) + '%');
    var tf = mid ? 'transform:translate(-50%,-50%)' + (a ? ' rotate(' + a + 'deg)' : '') + ';transform-origin:50% 50%' : a ? 'transform:rotate(' + a + 'deg);transform-origin:' + (right ? '100%' : '0') + ' 0' : '';
    return '<span class="im-lab' + (right && !mid ? ' im-lab-r' : '') + (mid ? ' im-lab-c' : '') + '" style="' + pos + (tf ? ';' + tf : '') + '" title="' + esc(l.jp || '') + '">' + esc(l.en || '').replace(/\n/g, '<br>') + '</span>';
  }
  I.labelHTML = labelHTML;
  // Book at a page: the first text of Book's that has the page's break
  function toBook(page) {
    var vs = ((B.doc || {}).versions || []).slice();
    (function next() {
      var vid = vs.shift(); if (!vid) { SW.toast('Page ' + page + ' is not in Book.', 3000); return; }
      SW.build(vid).then(function (b) {
        var at = null;
        (b.doc || []).some(function (d, p) { return d && d.blocks.some(function (bl) { if (bl.t === 'pb' && String(bl.facs) === String(page)) { at = { p: p, n0: bl.n0, n1: bl.n0 }; return true; } return false; }); });
        if (!at) { next(); return; }
        if (SW.book && SW.book.openAt) SW.book.openAt(vid, at); else { SW.select(vid); SW.state.sel = at; SW.setTab('book'); }
      }, next);
    })();
  }

  // ---------- a labelled copy, made when asked ----------
  function exportFig(f, kind, labels, ink) {
    var im = new Image();
    im.onload = function () {
      var W = im.naturalWidth, H = im.naturalHeight, fs = Math.max(11, Math.round(W * 0.022)), name = (B.slug || 'bench') + '-figure-' + (f.n != null ? f.n : f.id) + (labels ? '-en' + (ink === 'black' ? '-black' : '') : '');
      var fill = INK[ink] || INK.gold;
      var ls = labels ? f.labels : [];
      if (kind === 'png') {
        var c = document.createElement('canvas'); c.width = W; c.height = H;
        var g = c.getContext('2d'); g.drawImage(im, 0, 0);
        g.font = fs + 'px "Helvetica Neue", Arial, sans-serif'; g.textBaseline = 'top'; g.lineJoin = 'round';
        ls.forEach(function (l) {
          var lines = String(l.en || '').split('\n'), mid = l.anchor === 'center', right = l.align === 'right';
          g.save(); g.translate(l.x * W, l.y * H); if (+l.angle) g.rotate(+l.angle * Math.PI / 180);
          g.textAlign = mid ? 'center' : right ? 'right' : 'left'; g.textBaseline = mid ? 'middle' : 'top';
          lines.forEach(function (line, i) {
            var y = mid ? (i - (lines.length - 1) / 2) * fs * 1.2 : i * fs * 1.2;
            g.lineWidth = fs * 0.35; g.strokeStyle = 'rgba(255,255,255,0.95)'; g.strokeText(line, 0, y);
            g.fillStyle = fill; g.fillText(line, 0, y);
          });
          g.restore();
        });
        c.toBlob(function (blob) { save(blob, name + '.png'); }, 'image/png');
        return;
      }
      var c2 = document.createElement('canvas'); c2.width = W; c2.height = H; c2.getContext('2d').drawImage(im, 0, 0);
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' +
        '<image width="' + W + '" height="' + H + '" xlink:href="' + c2.toDataURL('image/png') + '"/>' +
        '<g font-family="Helvetica Neue, Arial, sans-serif" font-size="' + fs + '" fill="' + fill + '" stroke="#ffffff" stroke-width="' + (fs * 0.35).toFixed(1) + '" stroke-linejoin="round" paint-order="stroke">' +
        ls.map(function (l) {
          var lines = String(l.en || '').split('\n'), mid = l.anchor === 'center', right = l.align === 'right', x = (l.x * W).toFixed(1), y0 = (l.y * H).toFixed(1);
          return '<g transform="translate(' + x + ' ' + y0 + ')' + (+l.angle ? ' rotate(' + (+l.angle) + ')' : '') + '">' + lines.map(function (line, i) {
            var y = mid ? (i - (lines.length - 1) / 2) * fs * 1.2 : fs * (0.85 + i * 1.2);
            return '<text x="0" y="' + y.toFixed(1) + '" text-anchor="' + (mid ? 'middle' : right ? 'end' : 'start') + '"' + (mid ? ' dominant-baseline="central"' : '') + '>' + esc(line) + '</text>';
          }).join('') + '</g>';
        }).join('') + '</g></svg>';
      save(new Blob([svg], { type: 'image/svg+xml' }), name + '.svg');
    };
    im.onerror = function () { SW.toast('The figure’s file could not be read.', 3000); };
    im.src = f.file;
  }
  function save(blob, name) { var a = SW.el('a', { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
})(typeof window !== 'undefined' ? window : globalThis);
